# vsm-dictionary-rnacentral

<!-- badges: start -->
[![Build Status](https://travis-ci.com/UniBioDicts/vsm-dictionary-rnacentral.svg?branch=master)](https://travis-ci.com/UniBioDicts/vsm-dictionary-rnacentral)
[![npm version](https://img.shields.io/npm/v/vsm-dictionary-rnacentral)](https://www.npmjs.com/package/vsm-dictionary-rnacentral)
[![Downloads](https://img.shields.io/npm/dm/vsm-dictionary-rnacentral)](https://www.npmjs.com/package/vsm-dictionary-rnacentral)
<!-- badges: end -->

## Summary

`vsm-dictionary-rnacentral` is an implementation 
of the 'VsmDictionary' parent-class/interface (from the package
[`vsm-dictionary`](https://github.com/vsmjs/vsm-dictionary)), that uses 
the [EBI Search RESTful Web Services](https://www.ebi.ac.uk/ebisearch/apidoc.ebi) 
to interact with the RNAcentral database and translate the provided RNA data 
into a VSM-specific format.

## Install

Run: `npm install`

## Example use

Create a `test.js` file and include this code:

```javascript
const DictionaryRNAcentral = require('./DictionaryRNAcentral');
const dict = new DictionaryRNAcentral({log: true});

dict.getEntryMatchesForString('tp53', { page: 1, perPage: 10 }, 
  (err, res) => {
    if (err) 
      console.log(JSON.stringify(err, null, 4));
    else
      console.log(JSON.stringify(res, null, 4));
  }
);
```
Then, run `node test.js`

## Tests

Run `npm test`, which runs the source code tests with Mocha.  
If you want to quickly live test the EBI Search API, go to the 
`test` directory and run:
```
node getEntries.test.js
node getEntryMatchesForString.test.js
```

## 'Build' configuration

To use a VsmDictionary in Node.js, one can simply run `npm install` and then
use `require()`. But it is also convenient to have a version of the code that
can just be loaded via a &lt;script&gt;-tag in the browser.

Therefore, we included `webpack.config.js`, which is a Webpack configuration file for 
generating such a browser-ready package.

By running `npm build`, the built file will appear in a 'dist' subfolder. 
You can use it by including: 
`<script src="../dist/vsm-dictionary-rnacentral.min.js"></script>` in the
header of an HTML file. 

## Specification

Like all VsmDictionary subclass implementations, this package follows
the parent class
[specification](https://github.com/vsmjs/vsm-dictionary/blob/master/Dictionary.spec.md).
In the next sections we will explain the mapping between the data 
offered by EBI Search's API and the corresponding VSM objects. Find the 
documentation for the API here: https://www.ebi.ac.uk/ebisearch/documentation.ebi

Note that if we receive an error response from the EBI Search servers (see the 
URL requests for `getEnties` and `getEntryMatchesForString` below) that is not a
JSON string that we can parse, we formulate the error as a JSON object ourselves 
in the following format:
```
{
  status: <number>,
  error: <response> 
}
```
where the *response* from the server is JSON stringified.

### Map RNAcentral to DictInfo VSM object

This specification relates to the function:  
 `getDictInfos(options, cb)`

If the `options.filter.id` is not properly defined 
or the `https://www.rnacentral.org` dictID is included in the 
list of ids used for filtering, `getDictInfos` returns a static object 
with the following properties:
- `id`: 'https://www.rnacentral.org' (will be used as a `dictID`)
- `abbrev`: 'RNAcentral'
- `name`: 'RNAcentral'

Otherwise, an empty result is returned.

### Map RNAcentral to Entry VSM object

This specification relates to the function:  
 `getEntries(options, cb)`

Firstly, if the `options.filter.dictID` is properly defined and in the list of 
dictIDs the `https://www.rnacentral.org` dictID is not included, then 
an **empty array** of entry objects is returned.

If the `options.filter.id` is properly defined (with IDs like
`https://www.rnacentral.org/rna/URS0000301B08_9606` - note that all RNAcentral 
IDs must have the species taxonomy ID attached) then we use a query like this:

```
https://www.ebi.ac.uk/ebisearch/ws/rest/rnacentral/entry/URS0000301B08_9606,URS0000DDDDBA_720,URS0000000001_77133,URS0000A8C125_9606?fields=id%2Cname%2Cdescription%2Cgene%2Cgene_synonym%2Cactive%2Cexpert_db%2Crna_type%2Cspecies&format=json
```

For the above URL, we provide a brief description for each sub-part: 
- The first part refers to the EBI Search's main REST endpoint: https://www.ebi.ac.uk/ebisearch/ws/rest/
- The second part refers to the **domain** of search (*rnacentral*)
- The third part refers to the *entry* endpoint (which allows us to request 
for entry information associated with entry identifiers)
- The fourth part is the *entry IDs*, comma separated (we extract the last part 
of the RNAcentral-specific URI for each ID)
- The fifth part is the *fields* of interest - i.e. the information related to 
the entries that we will map to VSM-entry properties. For a complete list of the 
available fields for the RNAcentral domain, see: https://www.ebi.ac.uk/ebisearch/metadata.ebi?db=rnacentral
- The last part defines the format of the returned data (JSON)

Otherwise, we ask for all ids (by default **id sorted**) with this query:
```
 https://www.ebi.ac.uk/ebisearch/ws/rest/rnacentral?query=domain_source:rnacentral&fields=id%2Cname%2Cdescription%2Cgene%2Cgene_synonym%2Cactive%2Cexpert_db%2Crna_type%2Cspecies&sort=id&size=5&start=0&format=json
```

Note that depending on the `options.page` and `options.perPage` options 
we adjust the `size` and `start` parameters accordingly. The `size` requested 
can be between 0 and 100 and if its not in those limits or not properly defined, 
we set it to the default page size which is **50**. The `start` (offset, zero-based)
can be between 0 and 1000000. The default value for `start` is 0 (if `options.page`
is not properly defined) and if the *(page size) \* (#page requested - 1)* exceeds 1000000, then we set it to `999999`, 
allowing thus the retrieval of the last entry (EBI Search does not allow us to 
retrieve more than the 1000000th entry of a domain).

Only when requesting for specific IDs, we sort the results depending on the
`options.sort` value: results can be either `id`-sorted or `str`-sorted,
according to the specification of the parent 'VsmDictionary' class.
We then prune these results according to the values `options.page` (default: 1)
and `options.perPage` (default: 50).

When using the EBI search API, we get back a JSON object with an *entries* 
property, which has as a value an array of objects (the entries). Every entry
object has a *fields* property whose value is an object with properties all 
the fields that we defined in the initial query. We now provide a mapping of 
these fields to VSM-entry specific properties:

RNAcentral field | Type | Required | VSM entry/match object property | Notes  
:---:|:---:|:---:|:---:|:---:
`id` | Array | YES | `id`,`str`,`terms[0].str` | The VSM entry id is the full URI, for the `str` we use just the id string
`description` | Array | NO | `descr` | We use the first element only
`gene` | Array | NO | `terms[i].str` | We map the whole array
`gene_synonym` | Array | NO | `terms[i].str` | We map the whole array
`active` | Array | NO | `z.obsolete` | We use the first element only: if it is 'Active' then obsolete is false
`expert_db` | Array | NO | `z.databases` | The expert databases. We map the whole array
`rna_type` | Array | NO | `z.RNAtype` | The RNA molecule type. We use the first element only
`species` | Array | NO | `z.species` | We use the first element only

### Map RNAcentral to Match VSM object

This specification relates to the function:  
 `getEntryMatchesForString(str, options, cb)`

Firstly, if the `options.filter.dictID` is properly defined and in the list of 
dictIDs the `https://www.rnacentral.org` dictID is not included, then 
an **empty array** of match objects is returned.

Otherwise, an example of a URL string that is being built and send to the EBI 
Search's REST API when requesting for `tp53`, is:
```
https://www.ebi.ac.uk/ebisearch/ws/rest/rnacentral?query=tp53%2A&fields=id%2Cname%2Cdescription%2Cgene%2Cgene_synonym%2Cactive%2Cexpert_db%2Crna_type%2Cspecies&size=20&start=0&format=json
```

The fields requested are the same as in the `getEntries(options, cb)` 
case as well as the mapping shown in the table above. Also for the `size` and 
`start` parameters the same things apply as in the `getEntries` specification.
 
No sorting whatsoever is done on the server or client side. 

Note that we transform the user-provided search string (`str`) in order to get 
better results based on the Apache Lucene query syntax that EBI 
Search supports and to match the queries that are send from RNAcentral (the 
search box results from the website) to EBI search. We use the following rules:
- Trimming whitespaces at the end and beginning of `str`, as well as 
between the space-separated words included in the string
- Adding the asterisk (*) for multiple character wildcard searches when the word 
has more than 2 letters: `tp rna` => `tp rna*`
- Converting `and`, `or` and `not` keywords to the capitalized versions, for 
efficient multiple term search: 
`tp53 or code` => `tp53* OR code*` 

Note that multiple search terms separated by white spaces are combined by default 
in AND logic.

## License

This project is licensed under the AGPL license - see [LICENSE.md](LICENSE.md).
