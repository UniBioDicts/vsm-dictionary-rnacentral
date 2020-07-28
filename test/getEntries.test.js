/**
 * File used to quick test the `getEntries` function of
 * `DictionaryRNAcentral.js`
 */

const DictionaryRNAcentral = require('../src/DictionaryRNAcentral');

const dict = new DictionaryRNAcentral({log: true});

dict.getEntries({
  filter: {
    id: [
      'https://www.rnacentral.org/rna/URS0000301B08_9606',
      'https://www.rnacentral.org/rna/URS0000DDDDBA_720',
      'https://www.rnacentral.org/rna/URS0000772E1D_1458438',
      'https://www.rnacentral.org/rna/URS0000A8C125_9606',
    ]},
  sort: 'str',
  page: 1,
  perPage: 5
}, (err, res) => {
  if (err) console.log(JSON.stringify(err, null, 4));
  else {
    console.log(JSON.stringify(res, null, 4));
    console.log('\n#Results: ' + res.items.length);
  }
});
