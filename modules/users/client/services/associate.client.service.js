// AssociatedUser service used to communicate Associated User REST endpoints
(function () {
  'use strict';

  angular
    .module('users.services')
    .factory('AssociatedUserService', AssociatedUserService);

  AssociatedUserService.$inject = ['$resource'];

  function AssociatedUserService($resource) {
    return $resource('api/associated_users/:associatedUserId', {
      associatedUserId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
