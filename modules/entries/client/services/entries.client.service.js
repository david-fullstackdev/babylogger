// Entries service used to communicate Entries REST endpoints
(function () {
  'use strict';

  angular
    .module('entries')
    .factory('EntriesService', EntriesService)
    .factory('AwakePairEntryService', AwakePairEntryService)
    .factory('LastEntryService', LastEntryService);

  EntriesService.$inject = ['$resource'];

  function EntriesService($resource) {
    return $resource('api/entries/:entryId', {
      entryId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }

  LastEntryService.$inject = ['$resource'];

  function LastEntryService($resource) {
    return $resource('api/entries/:child/:type/:entryId?', {
      entryId: '@entryId',
      child: '@child',
      type: '@type'
    });
  }

  AwakePairEntryService.$inject = ['$resource'];

  function AwakePairEntryService($resource) {
    return $resource('api/awakePairEntry/:entryId', {
      entryId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
