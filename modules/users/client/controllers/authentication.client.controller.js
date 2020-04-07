(function () {
  'use strict';

  angular
    .module('users')
    .controller('AuthenticationController', AuthenticationController);

  AuthenticationController.$inject = ['$scope', '$state', 'UsersService', '$location', '$window', 'Authentication', 'PasswordValidator', 'Notification', 'DevicesService'];

  function AuthenticationController($scope, $state, UsersService, $location, $window, Authentication, PasswordValidator, Notification, DevicesService) {
    var vm = this;

    vm.authentication = Authentication;
    vm.getPopoverMsg = PasswordValidator.getPopoverMsg;
    vm.signup = signup;
    vm.signin = signin;
    vm.callOauthProvider = callOauthProvider;
    vm.deviceId = 'XB473621Z';
    // Get an eventual error defined in the URL query string:
    if ($location.search().err) {
      Notification.error({ message: $location.search().err });
    }

    // If user is signed in then redirect back home
    /*if (vm.authentication.user) {
      $location.path('/home');
    }*/

    function signup(isValid) {

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.userForm');

        return false;
      }

      var device = new DevicesService({
        deviceId: 'XB473621Z'
      });
      device.$save(function(response) {
        vm.credentials.devices = [response._id];
        UsersService.userSignup(vm.credentials)
          .then(onUserSignupSuccess)
          .catch(onUserSignupError);
      });
    }

    function signin(isValid) {

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.userForm');

        return false;
      }

      UsersService.userSignin(vm.credentials)
        .then(onUserSigninSuccess)
        .catch(onUserSigninError);
    }

    // OAuth provider request
    function callOauthProvider(url) {
      if ($state.previous && $state.previous.href) {
        url += '?redirect_to=' + encodeURIComponent($state.previous.href);
      }

      // Effectively call OAuth authentication route:
      $window.location.href = url;
    }

    // Authentication Callbacks

    function onUserSignupSuccess(response) {
      // If successful we assign the response to the global user model
      vm.authentication.user = response;
      if (window.localStorage) {
        window.localStorage.setItem('user', JSON.stringify(response));
      }
      Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Signup successful!' });
      // And redirect to the previous or home page
      // $state.go($state.previous.state.name || 'child-landing', $state.previous.params);
      $state.go('child-landing', $state.previous.params);
    }

    function onUserSignupError(response) {
      Notification.error({ message: response.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Signup Error!', delay: 6000 });
    }

    function onUserSigninSuccess(response) {
      // If successful we assign the response to the global user model
      vm.authentication.user = response;
      if (window.localStorage) {
        window.localStorage.setItem('user', JSON.stringify(response));
      }
      Notification.info({ message: 'Welcome ' + response.firstName });
      // And redirect to the previous or home page
      $state.go('child-landing', $state.previous.params);
    }

    function onUserSigninError(response) {
      Notification.error({ message: response.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Signin Error!', delay: 6000 });
    }
  }
}());
