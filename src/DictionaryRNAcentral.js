const Dictionary = require('vsm-dictionary');
const { getLastPartOfURL, fixedEncodeURIComponent, removeDuplicates } = require('./fun');

module.exports = class DictionaryRNAcentral extends Dictionary {

  constructor(options) {
    const opt = options || {};
    super(opt);

    // RNAcentral-specific parameters
    this.rnacentralDictID = 'https://www.rnacentral.org';
    this.rnacentralFields = 'id,name,description,gene,gene_synonym,active,expert_db,rna_type,species';
    this.ebiSearchRestURL = 'https://www.ebi.ac.uk/ebisearch/ws/rest/';
    this.ebiSearchDomain  = 'rnacentral';
    this.ebiSearchMaxPageSize = 100;
    this.ebiSearchMaxStart    = 1000000;
    this.ebiSearchFormat  = opt.format || 'json';

    const baseURL = opt.baseURL || this.ebiSearchRestURL + this.ebiSearchDomain;

    this.perPageDefault = 50;

    // enable the console.log() usage
    this.enableLogging = opt.log || false;

    this.urlGetEntries = opt.urlGetEntries || baseURL + '/entry/$ids';
    this.urlGetMatches = opt.urlGetMatches || baseURL + '?query=$queryString';
  }

  getDictInfos(options, cb) {
    return cb(null,
      {
        items: [
          {
            id: this.rnacentralDictID,
            abbrev: 'RNAcentral',
            name: 'RNAcentral'
          }
        ]
      });
  }

  getEntries(options, cb) {
    const url = this.prepareEntrySearchURL(options);

    if (this.enableLogging)
      console.log('URL: ' + url);

    this.request(url, (err, res) => {
      if (err) return cb(err);
      let entryObjArray = this.mapRNACentralResToEntryObj(res);

      // When requesting specific list of ids, do sorting and triming
      let arr = entryObjArray;
      if (this.hasProperFilterIDProperty(options)) {
        arr = this.trimEntryObjArray(
          this.sortEntries(entryObjArray, options), options
        );
      }

      // z-prune results
      arr = Dictionary.zPropPrune(arr, options.z);

      cb(err, { items: arr });
    });
  }

  getEntryMatchesForString(str, options, cb) {
    if ((!str) || (str.trim() === '')) return cb(null, {items: []});

    const url = this.prepareMatchStringSearchURL(str, options);

    if (this.enableLogging)
      console.log('URL: ' + url);

    this.request(url, (err, res) => {
      if (err) return cb(err);
      let matchObjArray = this.mapRNACentralResToMatchObj(res, str);

      // z-prune results
      let arr = Dictionary.zPropPrune(matchObjArray, options.z);

      cb(err, { items: arr });
    });
  }

  mapRNACentralResToEntryObj(res) {
    return res.entries.map(entry => ({
      id: this.rnacentralDictID + '/rna/' + entry.fields.id[0],
      dictID: this.rnacentralDictID,
      descr: entry.fields.description[0],
      terms: this.buildTerms(entry.fields.name,
        entry.fields.gene, entry.fields.gene_synonym),
      z: {
        ...((entry.fields.active.length !== 0)
          && {
            obsolete: (entry.fields.active[0] !== 'Active'),
          }
        ),
        ...((entry.fields.expert_db.length !== 0)
          && {
            databases: entry.fields.expert_db
          }
        ),
        ...((entry.fields.rna_type.length !== 0)
          && {
            RNAtype: entry.fields.rna_type[0]
          }
        ),
        ...((entry.fields.species.length !== 0)
          && {
            species: entry.fields.species[0],
          }
        )
      }
    }));
  }

  mapRNACentralResToMatchObj(res, str) {
    return res.entries.map(entry => {
      const mainTerm = this.getMainTerm(entry.fields.name,
        entry.fields.gene, entry.fields.gene_synonym);
      return {
        id: this.rnacentralDictID + '/rna/' + entry.fields.id[0],
        dictID: this.rnacentralDictID,
        str: mainTerm,
        descr: entry.fields.description[0],
        type: mainTerm.startsWith(str) ? 'S' : 'T',
        terms: this.buildTerms(entry.fields.name,
          entry.fields.gene, entry.fields.gene_synonym),
        z: {
          ...((entry.fields.active.length !== 0)
            && {
              obsolete: (entry.fields.active[0] !== 'Active'),
            }
          ),
          ...((entry.fields.expert_db.length !== 0)
            && {
              databases: entry.fields.expert_db
            }
          ),
          ...((entry.fields.rna_type.length !== 0)
            && {
              RNAtype: entry.fields.rna_type[0]
            }
          ),
          ...((entry.fields.species.length !== 0)
            && {
              species: entry.fields.species[0],
            }
          )
        }
      };
    });
  }

  prepareEntrySearchURL(options) {
    let url = this.urlGetEntries;
    let idList = [];

    // remove empty space ids
    if (this.hasProperFilterIDProperty(options)) {
      idList = options.filter.id.filter(id => id.trim() !== '');
    }

    if (idList.length !== 0) {
      // specific IDs
      let rnaCentralIDs = idList.map(id => getLastPartOfURL(id)).join();

      url = url.replace('$ids', rnaCentralIDs) + '?fields='
        + fixedEncodeURIComponent(this.rnacentralFields);
    } else {
      // all IDs
      url = url
        .replace('/entry/$ids', '?query=domain_source:' + this.ebiSearchDomain)
        + '&fields=' + fixedEncodeURIComponent(this.rnacentralFields);

      // add size and start URL parameters
      let pageSize = this.perPageDefault;
      if (this.hasProperPerPageProperty(options)
        && options.perPage <= this.ebiSearchMaxPageSize
      ) {
        pageSize = options.perPage;
      }

      url += '&size=' + pageSize;

      if (this.hasProperPageProperty(options)) {
        if ((options.page - 1) * pageSize < this.ebiSearchMaxStart)
          url += '&start=' + (options.page - 1) * pageSize;
        else
          url += '&start=' + (this.ebiSearchMaxStart - 1);
      } else
        url += '&start=0';
    }

    url += '&format=' + this.ebiSearchFormat;
    return url;
  }

  prepareMatchStringSearchURL(str, options) {
    let searchStr = this.getExtendedSearchString(str);
    let url = this.urlGetMatches
      .replace('$queryString', fixedEncodeURIComponent(searchStr))
      + '&fields=' + fixedEncodeURIComponent(this.rnacentralFields);

    // add size and start URL parameters
    let pageSize = this.perPageDefault;
    if (this.hasProperPerPageProperty(options)
      && options.perPage <= this.ebiSearchMaxPageSize
    ) {
      pageSize = options.perPage;
    }

    url += '&size=' + pageSize;

    if (this.hasProperPageProperty(options)) {
      if ((options.page - 1) * pageSize < this.ebiSearchMaxStart)
        url += '&start=' + (options.page - 1) * pageSize;
      else
        url += '&start=' + (this.ebiSearchMaxStart - 1);
    } else
      url += '&start=0';

    url += '&format=' + this.ebiSearchFormat;
    return url;
  }

  getExtendedSearchString(str) {
    let words = str.trim().split(' ');

    // and => AND, or => OR, (ab) => (ab), (abc) => (abc*)
    let changedWords = [];
    for (let word of words) {
      if (word === '') continue;

      let w = word.toLowerCase();
      if (w === 'and') {
        changedWords.push('AND');
        continue;
      } else if (w === 'or') {
        changedWords.push('OR');
        continue;
      } else if (w === 'not') {
        changedWords.push('NOT');
        continue;
      }

      (word.length < 3) ? changedWords.push(word) : changedWords.push(word + '*');
    }

    return changedWords.join(' ');
  }

  buildTerms(name, gene, geneSynonyms) {
    let res = [];

    let mainTerm = this.getMainTerm(name, gene, geneSynonyms);
    res.push({ str: mainTerm });

    let synonyms = removeDuplicates(gene.concat(geneSynonyms));

    for (let synonym of synonyms) {
      res.push({ str: synonym });
    }

    return res;
  }

  getMainTerm(name, gene, geneSynonyms) {
    if (name.length !== 0)
      return name[0];
    else if (gene.length !== 0)
      return gene[0];
    else // worst case, should never happen
      return geneSynonyms[0];
  }

  sortEntries(arr, options) {
    if (!this.hasProperEntrySortProperty(options)
      || options.sort === 'id'
      || options.sort === 'dictID')
      return arr.sort((a, b) =>
        this.str_cmp(a.id, b.id));
    else if (options.sort === 'str')
      return arr.sort((a, b) =>
        this.str_cmp(a.terms[0].str, b.terms[0].str)
        || this.str_cmp(a.id, b.id));
  }

  str_cmp(a, b, caseMatters = false) {
    if (!caseMatters) {
      a = a.toLowerCase();
      b = b.toLowerCase();
    }
    return a < b
      ? -1
      : a > b
        ? 1
        : 0;
  }

  trimEntryObjArray(arr, options) {
    let numOfResults = arr.length;
    let page = this.hasProperPageProperty(options)
      ? options.page
      : 1;
    let pageSize = this.hasProperPerPageProperty(options)
      ? options.perPage
      : this.perPageDefault;

    return arr.slice(
      ((page - 1) * pageSize),
      Math.min(page * pageSize, numOfResults)
    );
  }

  hasProperFilterIDProperty(options) {
    return options.hasOwnProperty('filter')
      && options.filter.hasOwnProperty('id')
      && Array.isArray(options.filter.id)
      && options.filter.id.length !== 0;
  }

  hasProperPageProperty(options) {
    return options.hasOwnProperty('page')
      && Number.isInteger(options.page)
      && options.page >= 1;
  }

  hasProperPerPageProperty(options) {
    return options.hasOwnProperty('perPage')
      && Number.isInteger(options.perPage)
      && options.perPage >= 1;
  }

  hasProperEntrySortProperty(options) {
    return options.hasOwnProperty('sort')
      && typeof options.sort === 'string'
      && (options.sort === 'dictID'
        || options.sort === 'id'
        || options.sort === 'str'
      );
  }

  request(url, cb) {
    const req = this.getReqObj();
    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        if (req.status !== 200)
          cb(JSON.parse(req.responseText));
        else {
          try {
            const response = JSON.parse(req.responseText);
            cb(null, response);
          } catch (err) {
            cb(err);
          }
        }
      }
    };
    req.open('GET', url, true);
    req.send();
  }

  getReqObj() {
    return new (typeof XMLHttpRequest !== 'undefined'
      ? XMLHttpRequest // In browser
      : require('xmlhttprequest').XMLHttpRequest  // In Node.js
    )();
  }

};
