(function () {
  'use strict';

  // Authentication service for user variables

  angular
    .module('users.services')
    .factory('Authentication', Authentication);

  Authentication.$inject = ['$window'];

  function Authentication($window) {
    var auth = {
      user: $window.user
    };
    if (!$window.user && window.localStorage) {
      auth.user = JSON.parse(window.localStorage.getItem('user'));
    }
    return auth;
  }
}());
