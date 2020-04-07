(function () {
  'use strict';

  angular
    .module('dailyreports')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('dailyreports', {
        templateUrl: 'modules/dailyreports/client/views/dailyreports.client.view.html',
        url: '/dailyreports?date&childIndex',
        controller: 'DailyreportsController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Daily List'
        }
      });
  }
}());
