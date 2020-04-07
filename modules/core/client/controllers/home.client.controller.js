(function () {
  'use strict';

  angular
    .module('core')
    .controller('HomeController', HomeController);

  HomeController.$inject = ['$scope', 'Authentication', '$state'];

  function HomeController($scope, Authentication, $state) {
    var vm = this;
    vm.authentication = Authentication;
    var offset = new Date().getTimezoneOffset();
    if (vm.authentication.user) {
      //vm.authentication.user.currentDeviceId = 'XB473621Z';
      $state.go('child-landing');
    } else {
      $state.go('authentication.signin');
    }
  }
}());
