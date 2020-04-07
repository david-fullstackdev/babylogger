(function () {
  'use strict';

  angular
    .module('summaries')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('summaries', {
        url: '/ped_summary?childIndex',
        templateUrl: 'modules/summaries/client/views/summaries.client.view.html',
        controller: 'SummariesController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Pediatrician Summary'
        }
      })
      .state('summarydetail', {
        url: '/detailreport?childIndex',
        templateUrl: 'modules/summaries/client/views/summary_detail.client.view.html',
        controller: 'SummaryDetailController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Detail Report'
        }
      });
  }

  getSummary.$inject = ['$stateParams', 'SummariesService'];

  function getSummary($stateParams, SummariesService) {
    return SummariesService.get({
      summaryId: $stateParams.summaryId
    }).$promise;
  }
}());
