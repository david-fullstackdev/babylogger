// Summaries service used to communicate Summaries REST endpoints
(function () {
  'use strict';

  angular
    .module('summaries')
    .factory('SummariesService', SummariesService)
    .factory('SummaryDetailService', SummaryDetailService);

  SummariesService.$inject = ['$resource'];

  function SummariesService($resource) {
    return $resource('api/summaries/:childId', {
      childId: '@childId'

    });
  }
  SummaryDetailService.$inject = ['$resource'];

  function SummaryDetailService($resource) {
    return $resource('api/summary_detail/:childId/', {
      childId: '@childId'
    });
  }
}());
