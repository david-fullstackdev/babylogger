(function () {
  'use strict';

  // Childs controller
  angular
    .module('childs')
    .controller('ChildsController', ChildsController);

  ChildsController.$inject = ['$scope', '$state', '$stateParams', 'Authentication', 'ChildsService', 'AgeFactory', '$mdDialog'];

  function ChildsController ($scope, $state, $stateParams, Authentication, ChildsService, AgeFactory, $mdDialog) {
    var vm = this;

    vm.authentication = Authentication;
    if (!vm.authentication.user) return $state.go('authentication.signin');
    $scope.childlist = ChildsService.query();
    $scope.isLoadedData = false;
    $scope.initialChildIndex = $stateParams.childIndex ? $stateParams.childIndex : 0;
    $scope.childlist.$promise.then(function (result) {
      var now = new Date();
      var entry_types = ['solidfood', 'wet', 'dirty', 'asleep', 'awake', 'miscellaneous', 'nursing', 'pumping', 'bottle'];
      for (var i = 0; i < result.length; i++) {
        var entries = result[i].entries;
        for (var j = 0; j < entry_types.length; j++) {
          if (entries[entry_types[j]]) {
            $scope.childlist[i].entries[entry_types[j]].logDate = entries[entry_types[j]].date;
            var log_ms = moment(now, 'DD/MM/YYYY HH:mm:ss').diff(moment(new Date(entries[entry_types[j]].date), 'DD/MM/YYYY HH:mm:ss'));
            var log_d = moment.duration(log_ms);
            $scope.childlist[i].entries[entry_types[j]].duration = log_d.format('d [d] h [h] m [m ago]');
            if (entry_types[j] == 'nursing' || entry_types[j] == 'pumping') {
              $scope.childlist[i].entries[entry_types[j]].last = '';
              if(entries[entry_types[j]].leftLast) {
                $scope.childlist[i].entries[entry_types[j]].last = 'L';
              } else if(entries[entry_types[j]].rightLast) {
                $scope.childlist[i].entries[entry_types[j]].last = 'R';
              }
              $scope.childlist[i].entries[entry_types[j]].totalDuration = calcTotalDuration(entries[entry_types[j]].leftDuration, entries[entry_types[j]].rightDuration);
            }
            if (entry_types[j] == 'pumping') {
              $scope.childlist[i].entries[entry_types[j]].totalQuantity = $scope.childlist[i].entries[entry_types[j]].leftQuantity + $scope.childlist[i].entries[entry_types[j]].rightQuantity;
            }
            if (entry_types[j] == 'miscellaneous') {
              $scope.childlist[i].entries[entry_types[j]].miscellaneousLabel = entries[entry_types[j]].miscellaneousLabel;
            }
          }
        }
        if ($scope.childlist[i].entries.asleep && $scope.childlist[i].entries.awake) {
          var asleepDate = new Date($scope.childlist[i].entries.asleep.date);
          var awakeDate = new Date($scope.childlist[i].entries.awake.date);
          if (awakeDate < asleepDate || (awakeDate.getTime() === asleepDate.getTime() && $scope.childlist[i].entries.asleep.created > $scope.childlist[i].entries.awake.created)) {
            $scope.childlist[i].entries.showSleepDuration = false;
            $scope.childlist[i].entries.awake = null;
          } else {
            awakeDate.setSeconds(1);
            $scope.childlist[i].entries.showSleepDuration = true;
            var ms = moment(awakeDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(asleepDate, 'DD/MM/YYYY HH:mm:ss'));
            var d = moment.duration(ms);
            $scope.childlist[i].entries.sleepDuration = d.format('d [d] h [h] m [m]');
          }
        } else {
          $scope.childlist[i].entries.showSleepDuration = false;
        }
      }
      $scope.child = $scope.childlist[$scope.initialChildIndex];
      $scope.isLoadedData = true;
    });

    $scope.editEntry = function(event, entry) {
      $state.go('entries.edit', { childId: entry.child, entryId: entry.entryid, type: entry.type, childIndex: $scope.initialChildIndex });
      /*var html = '<p>The "Asleep" entry just before this one has not been closed out with an "Awake" entry.</p><p>The sleep duration shown here is calculated from the first "Asleep" entry to the next "Awake" entry.</p>';
      if (entry && entry.type === 'awake') {
        html = '<p>There is no open "Asleep entry immediately before this "Awake" entry.</p><p>The sleep duration shown here is calculated from the last "Asleep" entry to the first following "Awake" entry</p>';
      }
      if (entry && event.target.localName !== 'md-icon') {
        $state.go('entries.edit', { childId: entry.child, entryId: entry.entryid, type: entry.type, childIndex: $scope.initialChildIndex });
      } else if (event.target.localName === 'md-icon') {
        $mdDialog.show(
          $mdDialog.alert()
            .parent(angular.element(document.body))
            .clickOutsideToClose(true)
            .title('Warning')
            .htmlContent(html)
            .targetEvent(event)
            .ok('Got it!')
        );
      }*/
    };

    $scope.getAgeOfBirth = function(birth) {
      return AgeFactory.getAgeOfBith(birth);
    };

    $scope.changeSlider = function(swiper) {
      $scope.child = $scope.childlist[swiper.activeIndex];
      $scope.initialChildIndex = swiper.activeIndex;
      $state.go('.', { childIndex: $scope.initialChildIndex }, { notify: false });
      $scope.$apply();
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
      result = totalDurationMin + ' min ' + totalDurationSec + ' sec';
      return result;
    };

    vm.error = null;
  }
}());
