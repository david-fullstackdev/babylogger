'use strict';

describe('Devices E2E Tests:', function () {
  describe('Test Devices page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/devices');
      expect(element.all(by.repeater('device in devices')).count()).toEqual(0);
    });
  });
});
