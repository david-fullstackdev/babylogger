'use strict';

describe('Childs E2E Tests:', function () {
  describe('Test Childs page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/childs');
      expect(element.all(by.repeater('child in childs')).count()).toEqual(0);
    });
  });
});
