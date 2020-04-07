(function () {
  'use strict';

  angular
    .module('core')
    .controller('HeaderController', HeaderController);

  HeaderController.$inject = ['$scope', '$state', 'Authentication', 'menuService', '$mdSidenav', '$location','ChildsService'];

  function HeaderController($scope, $state, Authentication, menuService, $mdSidenav, $location, ChildsService) {
    var vm = this;
    vm.accountMenu = menuService.getMenu('account').items[0];
    vm.authentication = Authentication;
    vm.isCollapsed = false;
    vm.menu = menuService.getMenu('topbar');
    vm.eventLabels = {
      'nursing': 'Nursing',
      'pumping': 'Pumping',
      'bottle': 'Bottle',
      'solidfood': 'Solid Food',
      'wet': 'Wet',
      'dirty': 'Dirty',
      'asleep': 'Sleep',
      'miscellaneous': 'Miscellaneous'
    };
    vm.navigatePage = function(state) {
      $mdSidenav('right').close()
        .then(function () {
          if (state === 'signout') {
            if (window.localStorage) {
              window.localStorage.removeItem('user');
            }
            window.location = '/api/auth/signout';
          } else {
            $state.go(state);
          }
        });
    };
    vm.isSectionSelected = function(state) {
      return $state.current.name === state;
    };
    $scope.openRightMenu = function() {
      // $mdSidenav('right').toggle();
    };

    $scope.$on('$stateChangeSuccess', stateChangeSuccess);

    function stateChangeSuccess() {
      // Collapsing the menu after navigation
      vm.isCollapsed = false;
      vm.currentState = $state.current.name;
      vm.entryType = $state.params.type;
      if ($state.params.childId) {
        vm.child = ChildsService.get({
          childId: $state.params.childId
        });
      }
      if ($state.params.childIndex) {
        vm.childIndex = $state.params.childIndex;
      }
      if ($state.params.page) {
        vm.pageState = $state.params.page;
      } else {
        vm.pageState = "";
      }
      if ($state.params.date) {
        vm.reportDate = $state.params.date;
      }
    }

    $scope.cancelEntryForm = function() {
      if (vm.pageState === 'dailyreports') {
        $state.go('dailyreports', { date: vm.reportDate, childIndex: vm.childIndex });
      } else {
        $state.go('child-landing', { childIndex: vm.childIndex });
      }
    };
  }
}());
