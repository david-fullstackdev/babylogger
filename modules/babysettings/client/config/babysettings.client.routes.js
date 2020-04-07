(function () {
  'use strict';

  angular
    .module('babysettings')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('babysettings', {
        url: '/babysettings',
        templateUrl: 'modules/babysettings/client/views/babysettings.client.view.html',
        controller: 'BabysettingsController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Baby Settings List'
        }
      });
  }

  getBabysetting.$inject = ['$stateParams', 'BabysettingsService'];

  function getBabysetting($stateParams, BabysettingsService) {
    return BabysettingsService.get({
      babysettingId: $stateParams.babysettingId
    }).$promise;
  }

  newBabysetting.$inject = ['BabysettingsService'];

  function newBabysetting(BabysettingsService) {
    return new BabysettingsService();
  }
}());
