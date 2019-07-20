const { getLastPartOfURL, fixedEncodeURIComponent, getElementsInParentheses,
  getStringBeforeFirstSeparator, removeDuplicates } = require('./fun');
const chai = require('chai'); chai.should();

describe('fun.js', () => {

  describe('getLastPartOfURL', () => {
    it('returns the last part of a URL', cb => {
      const url1 = 'http://data.bioontology.org/ontologies/RH-MESH';
      const url2 = 'https://www.uniprot.org/uniprot/P12345';
      const url3 = 'a/b/e';
      const url4 = 'string';

      getLastPartOfURL(url1).should.equal('RH-MESH');
      getLastPartOfURL(url2).should.equal('P12345');
      getLastPartOfURL(url3).should.equal('e');
      getLastPartOfURL(url4).should.equal('string');

      cb();
    });
  });

  describe('fixedEncodeURIComponent', () => {
    it('tests the difference between the standard encoding function ' +
      'and the updated implementation (compatible with RFC 3986)', cb => {
      encodeURIComponent('!').should.equal('!');
      fixedEncodeURIComponent('!').should.equal('%21');

      encodeURIComponent('\'').should.equal('\'');
      fixedEncodeURIComponent('\'').should.equal('%27');

      encodeURIComponent('(').should.equal('(');
      fixedEncodeURIComponent('(').should.equal('%28');

      encodeURIComponent(')').should.equal(')');
      fixedEncodeURIComponent(')').should.equal('%29');

      encodeURIComponent('*').should.equal('*');
      fixedEncodeURIComponent('*').should.equal('%2A');

      cb();
    });
  });

  describe('getElementsInParentheses', () => {
    it('returns proper results', cb => {
      getElementsInParentheses('').should.deep.equal([]);
      getElementsInParentheses('A protein').should.deep.equal([]);
      getElementsInParentheses('Acyl carrier protein 3, chloroplastic (ACP)')
        .should.deep.equal(['ACP']);
      getElementsInParentheses('Aspartate aminotransferase, mitochondrial (mAspAT) (EC 2.6.1.1) (EC 2.6.1.7) (Fatty acid-binding protein) (FABP-1)')
        .should.deep.equal(['mAspAT', 'EC 2.6.1.1', 'EC 2.6.1.7',
          'Fatty acid-binding protein', 'FABP-1']);
      getElementsInParentheses('A RT (00) [ E (AA) (B(B)) ]; (CC)')
        .should.deep.equal(['00', 'AA', 'B(B', 'CC']);
      cb();
    });
  });

  describe('getStringBeforeFirstSeparator', () => {
    it('returns proper results', cb => {
      getStringBeforeFirstSeparator('').should.equal('');
      getStringBeforeFirstSeparator('A protein  ').should.equal('A protein');
      getStringBeforeFirstSeparator('Acyl carrier protein 3, chloroplastic (ACP)', '(')
        .should.equal('Acyl carrier protein 3, chloroplastic');
      getStringBeforeFirstSeparator('Aspartate aminotransferase, mitochondrial (mAspAT) (EC 2.6.1.1) (EC 2.6.1.7) (Fatty acid-binding protein) (FABP-1)', '(')
        .should.equal('Aspartate aminotransferase, mitochondrial');
      getStringBeforeFirstSeparator('E (ER) [E R (ERT]', '[').should.equal('E (ER)');
      getStringBeforeFirstSeparator('A R (ER R); E (R)', ';').should.equal('A R (ER R)');

      cb();
    });
  });

  describe('removeDuplicates', () => {
    it('returns proper results', cb => {
      removeDuplicates([]).should.deep.equal([]);
      removeDuplicates([1,2,3]).should.deep.equal([1,2,3]);
      removeDuplicates([1,2,1,3,1,2]).should.deep.equal([1,2,3]);
      removeDuplicates(['r','t','t','s','r','e','s'])
        .should.deep.equal(['r','t','s','e']);
      cb();
    });
  });
});