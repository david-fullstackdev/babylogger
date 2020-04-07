(function () {
  'use strict';

  // Dailyreports controller
  angular
    .module('dailyreports')
    .controller('DailyreportsController', DailyreportsController);

  DailyreportsController.$inject = ['$scope', '$state', '$stateParams', 'Authentication', 'ChildsService', 'AgeFactory', 'DailyreportsService', '$mdBottomSheet', '$mdDialog'];

  function DailyreportsController ($scope, $state, $stateParams, Authentication, ChildsService, AgeFactory, DailyreportsService, $mdBottomSheet, $mdDialog) {
    var vm = this;

    vm.authentication = Authentication;
    if (!vm.authentication.user) return $state.go('authentication.signin');
    vm.error = null;
    $scope.childlist = ChildsService.query();
    $scope.isLoadedData = false;
    $scope.now = new Date();
    $scope.currentNavItem = 'none';
    $scope.offset = 0;
    $scope.initialChildIndex = $stateParams.childIndex ? $stateParams.childIndex : 0;
    $scope.report_date = $stateParams.date ? new Date($stateParams.date) : new Date();
    $scope.typeLabels = {
      miscellaneous: 'Miscellaneous',
      wet: 'Wet',
      dirty: 'Dirty',
      solidfood: 'Solid Food',
      awake: 'Awake',
      asleep: 'Asleep',
      nursing: 'Nursing',
      pumping: 'Pumping',
      bottle: 'Bottle'
    };
    $scope.childlist.$promise.then(function (result) {
      $scope.isLoadedData = true;
      $scope.startDate = new Date(moment().subtract(7, 'days'));
      $scope.endDate = new Date();
      $scope.reportType = 'summary';
      $scope.child = $scope.childlist[$scope.initialChildIndex];
      if ($scope.child.miscellaneous && $scope.child.miscellaneous !== '') {
        $scope.typeLabels.miscellaneous = $scope.child.miscellaneous;
      } else {
        $scope.typeLabels.miscellaneous = 'Miscellaneous';
      }
      $scope.getDailyReport();
    });
    $scope.openBottomSheet = function() {
      // $mdBottomSheet.show({
      //   template: '<md-bottom-sheet class="md-list md-has-header md-grid" layout="column"><md-subheader>Share</md-subheader><md-list layout="row" layout-align="center center"> <md-item><div><md-button class="md-padding"><md-icon md-font-set="material-icons"> mail </md-icon><div> Email </div></md-button></div></md-item><md-item><div><md-button class="md-padding"><md-icon md-font-set="material-icons"> subject </md-icon><div class="md-grid-text"> Subject </div></md-button></div></md-item><md-item><div><md-button class="md-padding"><md-icon md-font-set="material-icons"> apps </md-icon><div class="md-grid-text"> Export (.csv) </div></md-button></div></md-item></md-list></md-bottom-sheet>'
      // });
    };
    $scope.overlayToolbar = function(name) {
      $scope.currentNavItem = name;
    };

    $scope.getAgeOfBirth = function(birth) {
      return AgeFactory.getAgeOfBith(birth);
    };

    $scope.changeSlider = function(swiper) {
      $scope.child = $scope.childlist[swiper.activeIndex];
      if ($scope.child.miscellaneous && $scope.child.miscellaneous !== '') {
        $scope.typeLabels.miscellaneous = $scope.child.miscellaneous;
      } else {
        $scope.typeLabels.miscellaneous = 'Miscellaneous';
      }
      $scope.initialChildIndex = swiper.activeIndex;
      $state.go('.', { childIndex: $scope.initialChildIndex, date: $scope.report_date }, { notify: false });
      $scope.getDailyReport();
      $scope.$apply();
    };
    $scope.reportDates = [{date:$scope.report_date}, {date: $scope.report_date}, {date: $scope.report_date}];
    $scope.reportDates[0].date.setDate($scope.reportDates[0].date.getDate() - 1);
    $scope.reportDates[2].date.setDate($scope.reportDates[2].date.getDate() + 1);
    $scope.dateSlideIndex = 1;

    $scope.changeReportDate = function(swiper) {
      if (swiper.swipeDirection == 'next') {
        $scope.reportDates.push({date: $scope.reportDates[2].date});
        $scope.reportDates[3].date.setDate($scope.reportDates[3].date.getDate() + 1);
        $scope.reportDates.splice(0, 1);
        $scope.dateSlideIndex = 1;
      } else if(swiper.swipeDirection == 'prev') {
        $scope.reportDates.unshift({date: $scope.reportDates[0].date});
        $scope.reportDates[0].date.setDate($scope.reportDates[0].date.getDate() - 1);
        $scope.reportDates.pop();
        $scope.dateSlideIndex = 1;
      }
      $state.go('.', { childIndex: $scope.initialChildIndex, date: $scope.reportDates[1].date }, { notify: false });
      $scope.getDailyReport();
      $scope.$apply();
    };

    $scope.reportList = [];
    $scope.getDailyReport = function() {
      var dayBeginsAt = $scope.child.dayBeginsAt.match(/(\d+)\:(\d+) (\w+)/);
      var dayBeginHour = dayBeginsAt[1];
      var dayBeginMinutes = dayBeginsAt[2];
      var dayPM = dayBeginsAt[3];
      if (dayPM === 'PM') dayBeginHour = dayBeginHour % 12 + 12;
      else dayBeginHour = dayBeginHour % 12;
      var startDate = new Date($scope.report_date);
      startDate.setHours(dayBeginHour);
      startDate.setMinutes(dayBeginMinutes);
      startDate.setSeconds(0);
      var endDate = new Date($scope.report_date);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(dayBeginHour);
      endDate.setMinutes(dayBeginMinutes - 1);
      endDate.setSeconds(59);
      DailyreportsService.query({ child: $scope.child._id, startDate: startDate, endDate: endDate }).$promise.then(function(res) {
        $scope.reportList = res;
        angular.forEach($scope.reportList, function(item) {
          if (item.type == 'nursing' || item.type == 'pumping') {
            item.last = '';
            if(item.leftLast) {
              item.last = 'L';
            } else if(item.rightLast) {
              item.last = 'R';
            }
            item.totalDuration = calcTotalDuration(item.leftDuration, item.rightDuration);
          }
          if (item.type == 'pumping') {
            item.totalQuantity = item.leftQuantity + item.rightQuantity;
          }
        });
      });
    };

    $scope.editEntry = function(event, entry) {
      if (entry.type == 'awake') {
        $state.go('entries.edit', { childId: entry.child, entryId: entry.asleepEntryId, type: 'asleep', page: 'dailyreports', date: $scope.report_date, childIndex: $scope.initialChildIndex });
      } else {
        $state.go('entries.edit', { childId: entry.child, entryId: entry._id, type: entry.type, page: 'dailyreports', date: $scope.report_date, childIndex: $scope.initialChildIndex });
      }
    };

    $scope.showWarning = function(entry) {
      var html = '<p>The "Asleep" entry just before this one has not been closed out with an "Awake" entry.</p><p>The sleep duration shown here is calculated from the first "Asleep" entry to the next "Awake" entry.</p>';
      if (entry && entry.type === 'awake') {
        html = '<p>There is no open "Asleep entry immediately before this "Awake" entry.</p><p>The sleep duration shown here is calculated from the last "Asleep" entry to the first following "Awake" entry</p>';
      }
      $mdDialog.show(
        $mdDialog.alert()
          .parent(angular.element(document.body))
          .clickOutsideToClose(true)
          .title('Warning')
          .htmlContent(html)
          .targetEvent(event)
          .ok('Got it!')
      );
    };

    $scope.navigatePage = function(state) {
      $state.go(state, { childIndex: $scope.initialChildIndex });
    };

    var calcTotalDuration = function(leftDuration, rightDuration) {
      var result = "0 min 0 sec";
      var leftDurationMin = parseInt(leftDuration.split(':')[0]);
      var leftDurationSec = parseInt(leftDuration.split(':')[1]);
      var rightDurationMin = parseInt(rightDuration.split(':')[0]);
      var rightDurationSec = parseInt(rightDuration.split(':')[1]);
      var totalDurationMin =leftDurationMin + rightDurationMin;
      var totalDurationSec = leftDurationSec + rightDurationSec;
      totalDurationMin = totalDurationMin + parseInt(totalDurationSec / 60);
      totalDurationSec = totalDurationSec % 60;
      result = totalDurationMin + ' m ' + totalDurationSec + ' s';
      return result;
    };
  }
}());
