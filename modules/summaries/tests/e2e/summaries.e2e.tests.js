'use strict';

describe('Summaries E2E Tests:', function () {
  describe('Test Summaries page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/summaries');
      expect(element.all(by.repeater('summary in summaries')).count()).toEqual(0);
    });
  });
});
