// Babysettings service used to communicate Babysettings REST endpoints
(function () {
  'use strict';

  angular
    .module('babysettings')
    .factory('BabysettingsService', BabysettingsService)
    .factory('UserPwdResetService', UserPwdResetService);

  BabysettingsService.$inject = ['$resource'];
  UserPwdResetService.$inject = ['$q', '$http'];

  function BabysettingsService($resource) {
    return $resource('api/babysettings/:babysettingId', {
      babysettingId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }

  function UserPwdResetService($q, $http) {
    return {
      reset: function (associatedUser) {
        var deferred = $q.defer();
        $http.post('/api/associated_user_pwd_reset/' + associatedUser._id, {}).success(function (data) {
          deferred.resolve({
            data: data
          });
        }).error(function (msg, code) {
          deferred.reject(msg);
        });
        return deferred.promise;
      }
    };
  }
}());
