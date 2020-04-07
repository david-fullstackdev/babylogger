// Dailyreports service used to communicate Dailyreports REST endpoints
(function () {
  'use strict';

  angular
    .module('dailyreports')
    .factory('DailyreportsService', DailyreportsService);

  DailyreportsService.$inject = ['$resource'];

  function DailyreportsService($resource) {
    return $resource('api/dailyreport/:child/:startDate/:endDate', {
      child: '@child',
      startDate: '@startDate',
      endDate: '@endDate'
    });
  }
}());
