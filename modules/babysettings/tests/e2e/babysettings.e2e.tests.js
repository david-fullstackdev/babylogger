'use strict';

describe('Babysettings E2E Tests:', function () {
  describe('Test Babysettings page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/babysettings');
      expect(element.all(by.repeater('babysetting in babysettings')).count()).toEqual(0);
    });
  });
});
