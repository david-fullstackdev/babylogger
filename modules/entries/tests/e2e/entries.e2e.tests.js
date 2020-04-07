'use strict';

describe('Entries E2E Tests:', function () {
  describe('Test Entries page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/entries');
      expect(element.all(by.repeater('entry in entries')).count()).toEqual(0);
    });
  });
});
