(function () {
  'use strict';

  // Summaries controller
  angular
    .module('summaries')
    .controller('SummariesController', SummariesController);

  SummariesController.$inject = ['$scope', '$state', '$stateParams', '$mdBottomSheet', 'Authentication', 'ChildsService', 'AgeFactory', 'SummariesService'];

  function SummariesController ($scope, $state, $stateParams, $mdBottomSheet, Authentication, ChildsService, AgeFactory, SummariesService) {
    var vm = this;

    vm.authentication = Authentication;
    if (!vm.authentication.user) return $state.go('authentication.signin');

    $scope.childlist = ChildsService.query();
    $scope.isLoadedData = false;
    $scope.now = new Date();

    $scope.initialChildIndex = $stateParams.childIndex ? $stateParams.childIndex : 0;
    $scope.offset = 0;
    $scope.childlist.$promise.then(function (result) {
      $scope.isLoadedData = true;
      $scope.startDate = new Date(moment().subtract(7, 'days'));
      $scope.endDate = new Date();
      $scope.reportType = 'summary';
      $scope.child = $scope.childlist[$scope.initialChildIndex];
      $scope.calculateSummary($scope.child);
    });

    $scope.calculateSummary = function(child) {
      var dayBeginsAt = child.dayBeginsAt.match(/(\d+)\:(\d+) (\w+)/);
      var dayBeginHour = dayBeginsAt[1];
      var dayBeginMinutes = dayBeginsAt[2];
      var dayPM = dayBeginsAt[3];
      if (dayPM === 'PM') dayBeginHour = dayBeginHour % 12 + 12;
      var nightBeginsAt = child.nightBeginsAt.match(/(\d+)\:(\d+) (\w+)/);
      var nightBeginHour = nightBeginsAt[1];
      var nightBeginMinutes = nightBeginsAt[2];
      var nightPM = nightBeginsAt[3];
      if (nightPM === 'PM') nightBeginHour = nightBeginHour % 12 + 12;
      child.dayHourList = [];
      var i = 0;
      for (i = 0; i < 24; i++) {
        var tmpHour = dayBeginHour * 1 + i;
        var apm = ' am';
        if (tmpHour > 11 && tmpHour < 24) {
          apm = ' pm';
        }
        if (tmpHour > 12) {
          tmpHour = tmpHour % 12;
        }
        if (tmpHour === 0) {
          tmpHour = 12;
        }
        child.dayHourList.push(tmpHour + apm);
      }
      child.dayBeginHour = dayBeginHour > 12 ? dayBeginHour % 12 : dayBeginHour * 1;
      if (dayPM === 'PM') {
        if (child.dayBeginHour === 0) {
          child.dayBeginHour = 12;
        }
        child.dayBeginHour = child.dayBeginHour + ' pm';
      } else {
        if (child.dayBeginHour === 0) {
          child.dayBeginHour = 12;
        }
        child.dayBeginHour = child.dayBeginHour + ' am';
      }
      child.nightBeginHour = nightBeginHour > 12 ? nightBeginHour % 12 : nightBeginHour * 1;
      if (nightPM === 'PM') {
        if (child.nightBeginHour === 0) {
          child.nightBeginHour = 12;
        }
        child.nightBeginHour = child.nightBeginHour + ' pm';
      } else {
        if (child.nightBeginHour === 0) {
          child.nightBeginHour = 12;
        }
        child.nightBeginHour = child.nightBeginHour + ' am';
      }
      var oneDay = 24 * 60 * 60 * 1000;
      var dateRange = Math.round(Math.abs($scope.endDate.getTime() - $scope.startDate.getTime()) / oneDay);
      var dayNightList = {};
      var tmpDate = new Date($scope.startDate);
      for (i = 0; i <= dateRange+1; i++) {
        var tmpDateString = tmpDate.getFullYear() + '-' + (tmpDate.getMonth() + 1) + '-' + tmpDate.getDate();
        var dayBeginDate = new Date(tmpDate);
        dayBeginDate.setHours(dayBeginHour);
        dayBeginDate.setMinutes(dayBeginMinutes);
        dayBeginDate.setSeconds(0);
        var nightBeginDate = new Date(tmpDate);
        nightBeginDate.setHours(nightBeginHour);
        nightBeginDate.setMinutes(nightBeginMinutes);
        nightBeginDate.setSeconds(0);
        dayNightList[tmpDateString] = {
          dayBeginDate: dayBeginDate,
          nightBeginDate: nightBeginDate
        };
        tmpDate.setDate(tmpDate.getDate() + 1);
      }
      var startDate = new Date($scope.startDate);
      startDate.setHours(dayBeginHour);
      startDate.setMinutes(dayBeginMinutes - 1);
      startDate.setSeconds(59);
      var endDate = new Date($scope.endDate);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(dayBeginHour);
      endDate.setMinutes(dayBeginMinutes);
      endDate.setSeconds(0);

      var summary = SummariesService.query({ childId: child._id, startDate: startDate, endDate: endDate, dayNight: dayNightList });
      summary.$promise.then(function(res) {
        child.summary = res[0];
      });
    };

    $scope.openBottomSheet = function() {
      // $mdBottomSheet.show({
      //   template: '<md-bottom-sheet class="md-list md-has-header md-grid" layout="column"><md-subheader>Share</md-subheader><md-list layout="row" layout-align="center center"> <md-item><div><md-button class="md-padding"><md-icon md-font-set="material-icons"> mail </md-icon><div> Email </div></md-button></div></md-item><md-item><div><md-button class="md-padding"><md-icon md-font-set="material-icons"> subject </md-icon><div class="md-grid-text"> Subject </div></md-button></div></md-item><md-item><div><md-button class="md-padding"><md-icon md-font-set="material-icons"> apps </md-icon><div class="md-grid-text"> Export (.csv) </div></md-button></div></md-item></md-list></md-bottom-sheet>'
      // });
    };

    $scope.getAgeOfBirth = function(birth) {
      return AgeFactory.getAgeOfBith(birth);
    };

    $scope.changeSlider = function(swiper) {
      $scope.child = $scope.childlist[swiper.activeIndex];
      $scope.initialChildIndex = swiper.activeIndex;
      $state.go('.', { childIndex: swiper.activeIndex }, { notify: false });
      $scope.calculateSummary($scope.child);
      $scope.$apply();
    };

    $scope.navigatePage = function(state) {
      $state.go(state, { childIndex: $scope.initialChildIndex });
    };

  }
}());
