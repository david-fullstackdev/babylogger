// Childs service used to communicate Childs REST endpoints
(function () {
  'use strict';

  angular
    .module('babysettings')
    .factory('ChildsService', ChildsService);

  ChildsService.$inject = ['$resource'];

  function ChildsService($resource) {
    return $resource('api/childs/:childId', {
      childId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
