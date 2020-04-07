'use strict';

describe('Dailyreports E2E Tests:', function () {
  describe('Test Dailyreports page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/dailyreports');
      expect(element.all(by.repeater('dailyreport in dailyreports')).count()).toEqual(0);
    });
  });
});
