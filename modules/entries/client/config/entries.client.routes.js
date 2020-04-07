(function () {
  'use strict';

  angular
    .module('entries')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('entries', {
        abstract: true,
        url: '/entries',
        template: '<ui-view/>'
      })
      .state('entries.create', {
        url: '/:childId/create?type&childIndex',
        templateUrl: 'modules/entries/client/views/form-entry.client.view.html',
        controller: 'EntriesController',
        controllerAs: 'vm',
        resolve: {
          entryResolve: newEntry,
          childResolve: getChild,
          awakePairEntryResolve: newEntry
        },
        data: {
          roles: ['user', 'associate'],
          pageTitle: 'Entries Create'
        }
      })
      .state('entries.edit', {
        url: '/:childId/:entryId/edit?type&childIndex&page&date',
        templateUrl: 'modules/entries/client/views/form-entry.client.view.html',
        controller: 'EntriesController',
        controllerAs: 'vm',
        resolve: {
          entryResolve: getEntry,
          childResolve: getChild,
          awakePairEntryResolve: getAwakePairEntryResolve
        },
        data: {
          roles: ['user', 'associate'],
          pageTitle: 'Edit Entry {{ entryResolve.name }}'
        }
      });
  }

  getEntry.$inject = ['$stateParams', 'EntriesService'];

  function getEntry($stateParams, EntriesService) {
    return EntriesService.get({
      entryId: $stateParams.entryId
    }).$promise;
  }

  getAwakePairEntryResolve.$inject = ['$stateParams', 'AwakePairEntryService'];

  function getAwakePairEntryResolve($stateParams, AwakePairEntryService) {
    if ($stateParams.type == 'asleep') {
      return AwakePairEntryService.get({
        entryId: $stateParams.entryId
      }).$promise;
    } else {
      return null;
    }
  }

  newEntry.$inject = ['EntriesService'];

  function newEntry(EntriesService) {
    return new EntriesService();
  }

  getChild.$inject = ['$stateParams', 'ChildsService'];

  function getChild($stateParams, ChildsService) {
    return ChildsService.get({
      childId: $stateParams.childId
    }).$promise;
  }
}());
