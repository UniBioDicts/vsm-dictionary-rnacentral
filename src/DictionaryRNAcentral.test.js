const DictionaryRNAcentral = require('./DictionaryRNAcentral');
const chai = require('chai'); chai.should();
const expect = chai.expect;
const nock = require('nock');
const fs = require('fs');
const path = require('path');

describe('DictionaryRNAcentral.js', () => {

  const testURLBase = 'http://test';
  const dict =
    new DictionaryRNAcentral({ baseURL: testURLBase, log: true });

  const melanomaStr = 'melanoma';
  const noResultsStr = 'somethingThatDoesNotExist';

  const getIDPath = path.join(__dirname, '..', 'resources', 'id.json');
  const getMelanomaPath = path.join(__dirname, '..', 'resources', 'melanoma.json');

  const getIDStr = fs.readFileSync(getIDPath, 'utf8');
  const getMatchesForMelanomaStr = fs.readFileSync(getMelanomaPath, 'utf8');

  before(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  after(() => {
    nock.enableNetConnect();
  });

  describe('getDictInfos', () => {
    it('returns proper RNAcentral dictInfo object', cb => {

      dict.getDictInfos({}, (err, res) => {
        expect(err).to.be.null;
        res.should.deep.equal({
          items: [
            {
              id: 'https://www.rnacentral.org',
              abbrev: 'RNAcentral',
              name: 'RNAcentral'
            }
          ]
        });
        cb();
      });
    });
  });

  describe('mapRNACentralResToEntryObj', () => {
    it('properly maps EBI Search returned JSON object to a VSM entry '
      + 'object', cb => {
      dict.mapRNACentralResToEntryObj(JSON.parse(getIDStr)).should.deep.equal(
        [
          {
            id: 'https://www.rnacentral.org/rna/URS0000301B08_9606',
            dictID: 'https://www.rnacentral.org',
            descr: 'Homo sapiens (human) non-protein coding HOTAIR:1',
            terms: [
              {
                str: 'Unique RNA Sequence URS0000301B08_9606'
              },
              {
                str: 'HOTAIR'
              },
              {
                str: 'NONHSAG011264.2'
              },
              {
                str: 'OTTHUMG00000152934.1'
              },
              {
                str: 'ENSG00000228630'
              },
              {
                str: 'ENSG00000228630.5'
              },
              {
                str: 'ENSG00000228630.1'
              },
              {
                str: 'HOXC-AS4'
              },
              {
                str: 'NCRNA00072'
              },
              {
                str: 'HOXC11-AS1'
              }
            ],
            z: {
              obsolete: false,
              databases: [
                'NONCODE',
                'GENCODE',
                'LNCipedia',
                'Ensembl'
              ],
              RNAtype: 'lncRNA',
              species: 'Homo sapiens'
            }
          }
        ]
      );

      cb();
    });
  });

  describe('mapRNACentralResToMatchObj', () => {
    it('properly maps EBI Search returned JSON object to a VSM match '
      + 'object', cb => {
      dict.mapRNACentralResToMatchObj(JSON.parse(getMatchesForMelanomaStr), 'melanoma')
        .should.deep.equal(
          [
            {
              id: 'https://www.rnacentral.org/rna/URS0000BD2F89_9606',
              dictID: 'https://www.rnacentral.org',
              str: 'Unique RNA Sequence URS0000BD2F89_9606',
              descr: 'Homo sapiens (human) survival associated mitochondrial melanoma specific oncogenic non-coding RNA (SAMMSON)',
              type: 'T',
              terms: [
                {
                  str: 'Unique RNA Sequence URS0000BD2F89_9606'
                },
                {
                  str: 'SAMMSON'
                },
                {
                  str: 'HSALNG0026715'
                },
                {
                  str: 'ENSG00000240405.6'
                }
              ],
              z: {
                obsolete: false,
                databases: [
                  'LncBook',
                  'GENCODE',
                  'LNCipedia',
                  'Ensembl'
                ],
                RNAtype: 'lncRNA',
                species: 'Homo sapiens'
              }
            }
          ]
        );

      cb();
    });
  });

  describe('prepareEntrySearchURL', () => {
    it('returns proper URL(s)', cb => {
      const url1 = dict.prepareEntrySearchURL({});
      const url2 = dict.prepareEntrySearchURL({ page: 1, perPage: 2 });
      const url3 = dict.prepareEntrySearchURL({ filter: { id: ['']}, page: 1, perPage: 2 });
      const url4 = dict.prepareEntrySearchURL({ sort: 'id', page: 2, perPage: 500 });
      const url5 = dict.prepareEntrySearchURL({ sort: 'dictID', page: 101, perPage: 101 });
      const url6 = dict.prepareEntrySearchURL({ sort: 'dictID', page: 101, perPage: 100 });
      const url7 = dict.prepareEntrySearchURL({ sort: 'dictID', page: 10001, perPage: 100 });
      const url8 = dict.prepareEntrySearchURL({ filter: {
        id: [
          'https://rnacentral.org/rna/URS0000301B08_9606'
        ]}, page: 3, perPage: 20 });
      const url9 = dict.prepareEntrySearchURL({ filter: {
        id: [
          '',
          'https://rnacentral.org/rna/URS0000301B08_9606',
          'https://rnacentral.org/rna/URS0000DDDDBA_720'
        ]}, page: -1, perPage: 101 });

      const getAllIDsURLPart = 'domain_source:rnacentral';
      const formatURLPart = '&format=json';
      const URLfields = 'fields=id%2Cname%2Cdescription%2Cgene%2Cgene_synonym%2Cactive%2Cexpert_db%2Crna_type%2Cspecies';
      const expectedURL1 = testURLBase + '?query=' + getAllIDsURLPart
        + '&' + URLfields + '&size=50&start=0' + formatURLPart;
      const expectedURL2 = testURLBase + '?query=' + getAllIDsURLPart
        + '&' + URLfields + '&size=2&start=0' + formatURLPart;
      const expectedURL3 = testURLBase + '?query=' + getAllIDsURLPart
        + '&' + URLfields + '&size=2&start=0' + formatURLPart;
      const expectedURL4 = testURLBase + '?query=' + getAllIDsURLPart
        + '&' + URLfields + '&size=50&start=50' + formatURLPart;
      const expectedURL5 = testURLBase + '?query=' + getAllIDsURLPart
        + '&' + URLfields + '&size=50&start=5000' + formatURLPart;
      const expectedURL6 = testURLBase + '?query=' + getAllIDsURLPart
        + '&' + URLfields + '&size=100&start=10000' + formatURLPart;
      const expectedURL7 = testURLBase + '?query=' + getAllIDsURLPart
        + '&' + URLfields + '&size=100&start=999999' + formatURLPart;
      const expectedURL8 = testURLBase + '/entry/URS0000301B08_9606'
        + '?' + URLfields + formatURLPart;
      const expectedURL9 = testURLBase + '/entry/URS0000301B08_9606,URS0000DDDDBA_720'
        + '?' + URLfields + formatURLPart;

      url1.should.equal(expectedURL1);
      url2.should.equal(expectedURL2);
      url3.should.equal(expectedURL3);
      url4.should.equal(expectedURL4);
      url5.should.equal(expectedURL5);
      url6.should.equal(expectedURL6);
      url7.should.equal(expectedURL7);
      url8.should.equal(expectedURL8);
      url9.should.equal(expectedURL9);

      cb();
    });
  });

  describe('prepareMatchStringSearchURL', () => {
    it('returns proper URL', cb => {
      const url1 = dict.prepareMatchStringSearchURL(melanomaStr, {});
      const expectedURL = testURLBase + '?query=melanoma&fields=id%2Cname%2Cdescription%2Cgene%2Cgene_synonym%2Cactive%2Cexpert_db%2Crna_type%2Cspecies';
      const paginationURLPart1 = '&size=50&start=0';
      const formatURLPart = '&format=json';

      url1.should.equal(expectedURL + paginationURLPart1 + formatURLPart);

      const url2 = dict.prepareMatchStringSearchURL(melanomaStr, { page: 'String' });
      url2.should.equal(expectedURL + paginationURLPart1 + formatURLPart);

      const url3 = dict.prepareMatchStringSearchURL(melanomaStr, { page: 0 });
      url3.should.equal(expectedURL + paginationURLPart1 + formatURLPart);

      const url4 = dict.prepareMatchStringSearchURL(melanomaStr, { page: 4 });
      const paginationURLPart2 = '&size=50&start=150';
      url4.should.equal(expectedURL + paginationURLPart2 + formatURLPart);

      const url5 = dict.prepareMatchStringSearchURL(melanomaStr, { perPage: ['Str'] });
      url5.should.equal(expectedURL + paginationURLPart1 + formatURLPart);

      const url6 = dict.prepareMatchStringSearchURL(melanomaStr, { perPage: 0 });
      url6.should.equal(expectedURL + paginationURLPart1 + formatURLPart);

      const url7 = dict.prepareMatchStringSearchURL(melanomaStr,
        { page: 3, perPage: 100 });
      const paginationURLPart3 = '&size=100&start=200';
      url7.should.equal(expectedURL + paginationURLPart3 + formatURLPart);

      const url8 = dict.prepareMatchStringSearchURL(melanomaStr,
        { page: 1, perPage: 2 });
      const paginationURLPart4 = '&size=2&start=0';
      url8.should.equal(expectedURL + paginationURLPart4 + formatURLPart);

      cb();
    });
  });

  describe('sortEntries', () => {
    it('sorts VSM entry objects as specified in the documentation', cb => {
      const arr = [
        { id: 'e', dictID: 'rnacentral', terms: [{ str: 'a'}] },
        { id: 'd', dictID: 'rnacentral', terms: [{ str: 'b'}] },
        { id: 'c', dictID: 'rnacentral', terms: [{ str: 'c'}] },
        { id: 'b', dictID: 'rnacentral', terms: [{ str: 'b'}] },
        { id: 'a', dictID: 'rnacentral', terms: [{ str: 'c'}] }
      ];
      const arrIdSorted = [
        { id: 'a', dictID: 'rnacentral', terms: [{ str: 'c'}] },
        { id: 'b', dictID: 'rnacentral', terms: [{ str: 'b'}] },
        { id: 'c', dictID: 'rnacentral', terms: [{ str: 'c'}] },
        { id: 'd', dictID: 'rnacentral', terms: [{ str: 'b'}] },
        { id: 'e', dictID: 'rnacentral', terms: [{ str: 'a'}] }
      ];
      const arrStrSorted = [
        { id: 'e', dictID: 'rnacentral', terms: [{ str: 'a'}] },
        { id: 'b', dictID: 'rnacentral', terms: [{ str: 'b'}] },
        { id: 'd', dictID: 'rnacentral', terms: [{ str: 'b'}] },
        { id: 'a', dictID: 'rnacentral', terms: [{ str: 'c'}] },
        { id: 'c', dictID: 'rnacentral', terms: [{ str: 'c'}] }
      ];

      const options = {};
      dict.sortEntries(arr, options).should.deep.equal(arrIdSorted);
      options.sort = {};
      dict.sortEntries(arr, options).should.deep.equal(arrIdSorted);
      options.sort = '';
      dict.sortEntries(arr, options).should.deep.equal(arrIdSorted);
      options.sort = 'dictID';
      dict.sortEntries(arr, options).should.deep.equal(arrIdSorted);
      options.sort = 'id';
      dict.sortEntries(arr, options).should.deep.equal(arrIdSorted);
      options.sort = 'str';
      dict.sortEntries(arr, options).should.deep.equal(arrStrSorted);

      cb();
    });
  });

  describe('trimEntryObjArray', () => {
    it('properly trims given array of VSM entry objects', cb => {
      const arr = [
        { id:'a', dictID: 'A', terms: [{ str: 'aaa'}] },
        { id:'b', dictID: 'B', terms: [{ str: 'bbb'}] },
        { id:'c', dictID: 'C', terms: [{ str: 'ccc'}] }
      ];

      let options = {};
      dict.trimEntryObjArray(arr, options).should.deep.equal(arr);

      options.page = 2;
      dict.trimEntryObjArray([], options).should.deep.equal([]);

      options.page = -1;
      options.perPage = 'no';
      dict.trimEntryObjArray(arr, options).should.deep.equal(arr);

      options.page = 1;
      options.perPage = 2;
      dict.trimEntryObjArray(arr, options).should.deep.equal(arr.slice(0,2));

      options.page = 2;
      dict.trimEntryObjArray(arr, options).should.deep.equal(arr.slice(2,3));

      options.page = 3;
      dict.trimEntryObjArray(arr, options).should.deep.equal([]);

      cb();
    });
  });

  describe('hasProperEntrySortProperty', () => {
    it('returns true or false whether the `options.sort` property for an ' +
      'entry VSM object is properly defined', cb => {
      const options = {};
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = [];
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = {};
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = '';
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = 45;
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);
      options.sort = 'dictID';
      expect(dict.hasProperEntrySortProperty(options)).to.equal(true);
      options.sort = 'id';
      expect(dict.hasProperEntrySortProperty(options)).to.equal(true);
      options.sort = 'str';
      expect(dict.hasProperEntrySortProperty(options)).to.equal(true);
      options.sort = noResultsStr;
      expect(dict.hasProperEntrySortProperty(options)).to.equal(false);

      cb();
    });
  });
});
