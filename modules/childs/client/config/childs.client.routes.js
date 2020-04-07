(function () {
  'use strict';

  angular
    .module('childs')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('child-landing', {
        url: '/home?childIndex',
        templateUrl: 'modules/childs/client/views/childs.client.view.html',
        controller: 'ChildsController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Home'
        }
      });
  }

  getChild.$inject = ['$stateParams', 'ChildsService'];

  function getChild($stateParams, ChildsService) {
    return ChildsService.get({
      childId: $stateParams.childId
    }).$promise;
  }

  newChild.$inject = ['ChildsService'];

  function newChild(ChildsService) {
    return new ChildsService();
  }
}());
