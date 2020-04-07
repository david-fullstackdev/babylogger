(function () {
  'use strict';

  // Entries controller
  angular
    .module('entries')
    .controller('EntriesController', EntriesController);

  EntriesController.$inject = ['$scope', '$state', '$stateParams', '$mdDialog', '$window', 'Authentication', 'entryResolve', 'awakePairEntryResolve', 'childResolve', 'AgeFactory', 'EntriesService', 'Notification', 'LastEntryService'];

  function EntriesController ($scope, $state, $stateParams, $mdDialog, $window, Authentication, entry, awakePairEntry, child, AgeFactory, EntriesService, Notification, LastEntryService) {
    var vm = this;

    vm.authentication = Authentication;
    if (!vm.authentication.user) return $state.go('authentication.signin');

    $scope.childIndex = $stateParams.childIndex ? $stateParams.childIndex : 0;
    $scope.lastEntry = LastEntryService.get({child: child._id, type: $stateParams.type?$stateParams.type:'nursing', entryId: entry._id?entry._id:null});

    $scope.isSleepType = $stateParams.type=='asleep' ? true : false;

    $scope.eventBtnClickCount = {
      left: 0,
      right: 0
    };

    $scope.eventDuration = {
      left: "00:00",
      right: "00:00",
      total: "00:00"
    };

    $scope.leftQuantity = $scope.rightQuantity = 0;
    $scope.lastSide = null;
    $scope.manualEdit = false;

    $scope.pageState = $stateParams.page;
    $scope.reportDate = $stateParams.date;
    $scope.entry = entry;
    $scope.isLoading = false;
    $scope.error = null;
    $scope.form = {};

    $scope.hours = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    $scope.minutes = [];
    $scope.manualIntervals = [];
    for (var i = 0; i < 60; i++) {
      $scope.minutes.push(i < 10 ? '0' + i : i);
      $scope.manualIntervals.push(i);
    }
    
    $scope.manualDuration = {
      leftMinute: 0,
      leftSecond: 0,
      rightMinute: 0,
      rightSecond: 0
    };
    
    $scope.time_type = ['AM', 'PM'];
    $scope.quantities = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];
    $scope.bottleContents = ['Breastmilk', 'Dairy Milk', 'Formula'];
    $scope.bottleContents = $scope.bottleContents.concat(child.bottleContents||[]);
    if ($scope.bottleContents.indexOf(null) > -1) {
      $scope.bottleContents.splice($scope.bottleContents.indexOf(null), 1);
    }
    $scope.bottleQuantities = [];
    var maxBottleQuantity = 0.5;
    while (maxBottleQuantity <= 16) {
      $scope.bottleQuantities.push(maxBottleQuantity);
      maxBottleQuantity += 0.5;
    }
    var now = new Date();

    $scope.calcSleepDuration = function () {
      var asleepDate = new Date($scope.entry.date);
      var awakeDate = new Date($scope.awakeEntry.date);
      var ms = moment(awakeDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(asleepDate, 'DD/MM/YYYY HH:mm:ss'));
      var d = moment.duration(ms);
      $scope.sleepDuration = d.format('d [d] h [h] m [m]');
    };

    $scope.changeSleepTime = function() {
      if ($scope.enableAsleep && $scope.enableAwake) {
        var hours = /am/i.test($scope.primary_entry.type) ? parseInt($scope.primary_entry.hour % 12, 10) : parseInt($scope.primary_entry.hour % 12, 10) + 12;
        $scope.entry.date.setHours(parseInt(hours, 10));
        $scope.entry.date.setMinutes(parseInt($scope.primary_entry.minute, 10));
        $scope.entry.date.setSeconds(0);
        $scope.entry.date.setMilliseconds(0);

        var secondaryHours = /am/i.test($scope.secondary_entry.type) ? parseInt($scope.secondary_entry.hour % 12, 10) : parseInt($scope.secondary_entry.hour % 12, 10) + 12;
        $scope.awakeEntry.date.setHours(parseInt(secondaryHours, 10));
        $scope.awakeEntry.date.setMinutes(parseInt($scope.secondary_entry.minute, 10));
        $scope.awakeEntry.date.setSeconds(0);
        $scope.awakeEntry.date.setMilliseconds(0);
        $scope.calcSleepDuration();
      }
    };

    if (!$scope.entry._id) {
      $scope.entry = new EntriesService({
        type: $stateParams.type ? $stateParams.type : 'solidfood',
        child: child,
        note: '',
        date: new Date(),
        time: formatAMPM(new Date()),
        leftQuantity: 0,
        rightQuantity: 0,
        quantity: 4,
        contents: null
      });
      if ($stateParams.type == 'miscellaneous') {
        $scope.entry.miscellaneousLabel = 'Miscellaneous';
        if (child.miscellaneous && child.miscellaneous !== '') {
          $scope.entry.miscellaneousLabel = child.miscellaneous;
        }
      }
      if ($scope.isSleepType) {
        $scope.awakeEntry = new EntriesService({
          type: 'awake',
          child: child,
          note: '',
          date: new Date(),
          time: formatAMPM(new Date())
        });
        $scope.enableAsleep = true;
        $scope.enableAwake = false;
      }
    } else {
      if ($scope.isSleepType) {
        if (awakePairEntry._id) {
          $scope.awakeEntry  = awakePairEntry;
          $scope.awakeEntry.date = new Date($scope.awakeEntry.date);
          $scope.calcSleepDuration();
        } else {
          $scope.awakeEntry = new EntriesService({
            type: 'awake',
            child: child,
            note: '',
            date: new Date(),
            time: formatAMPM(new Date())
          });
        }
        $scope.enableAsleep = true;
        $scope.enableAwake = true;
      }
      $scope.entry.date = new Date($scope.entry.date);

      $scope.eventDuration.left = $scope.entry.leftDuration;
      $scope.eventDuration.right = $scope.entry.rightDuration;
      $scope.entry.leftQuantity = $scope.entry.leftQuantity ? $scope.entry.leftQuantity : 0;
      $scope.entry.rightQuantity = $scope.entry.rightQuantity ? $scope.entry.rightQuantity : 0;
      $scope.entry.quantity = $scope.entry.quantity ? $scope.entry.quantity : 4;
      $scope.entry.contents = $scope.entry.contents ? $scope.entry.contents : null;
      if (!$scope.entry.miscellaneousLabel || $scope.entry.miscellaneousLabel == '') {
        $scope.entry.miscellaneousLabel = child.miscellaneous?child.miscellaneous:'';
      }
      var leftDurationMin = parseInt($scope.eventDuration.left.split(':')[0]);
      var leftDurationSec = parseInt($scope.eventDuration.left.split(':')[1]);
      var rightDurationMin = parseInt($scope.eventDuration.right.split(':')[0]);
      var rightDurationSec = parseInt($scope.eventDuration.right.split(':')[1]);
      var totalDurationMin =leftDurationMin + rightDurationMin;
      var totalDurationSec = leftDurationSec + rightDurationSec;
      totalDurationMin = totalDurationMin + parseInt(totalDurationSec / 60);
      totalDurationSec = totalDurationSec % 60;
      $scope.eventDuration.total = (totalDurationMin < 10 ? "0" + totalDurationMin : totalDurationMin) + ":" + (totalDurationSec < 10 ? "0" + totalDurationSec : totalDurationSec);
      if ($scope.entry.leftLast) {
        $scope.lastSide = 'left';
      }
      if ($scope.entry.rightLast) {
        $scope.lastSide = 'right';
      }
    }

    $scope.entry.time = $scope.entry.time ? $scope.entry.time : formatAMPM(now);
    $scope.primary_entry = {
      hour: 0,
      minute: 0,
      type: 'AM'
    };
    $scope.primary_entry.hour = $scope.entry.date.getHours();
    $scope.primary_entry.minute = $scope.entry.date.getMinutes();
    if ($scope.primary_entry.minute < 10) $scope.primary_entry.minute = '0' + $scope.primary_entry.minute;
    if ($scope.primary_entry.hour > 12) {
      $scope.primary_entry.hour = $scope.primary_entry.hour % 12;
      $scope.primary_entry.type = 'PM';
    } else if ($scope.primary_entry.hour === 12) {
      $scope.primary_entry.type = 'PM';
    } else {
      $scope.primary_entry.type = 'AM';
    }
    if ($scope.primary_entry.hour < 10) $scope.primary_entry.hour = '0' + $scope.primary_entry.hour;
    if ($scope.isSleepType) {
      $scope.secondary_entry = {
        hour: 0,
        minute: 0,
        type: 'AM'
      };
      $scope.awakeEntry.time = $scope.awakeEntry.time ? $scope.awakeEntry.time : formatAMPM(now);
      $scope.secondary_entry.hour = $scope.awakeEntry.date.getHours();
      $scope.secondary_entry.minute = $scope.awakeEntry.date.getMinutes();
      if ($scope.secondary_entry.minute < 10) $scope.secondary_entry.minute = '0' + $scope.secondary_entry.minute;
      if ($scope.secondary_entry.hour > 12) {
        $scope.secondary_entry.hour = $scope.secondary_entry.hour % 12;
        $scope.secondary_entry.type = 'PM';
      } else if ($scope.secondary_entry.hour === 12) {
        $scope.secondary_entry.type = 'PM';
      } else {
        $scope.secondary_entry.type = 'AM';
      }
      if ($scope.secondary_entry.hour < 10) $scope.secondary_entry.hour = '0' + $scope.secondary_entry.hour;
    }
    $scope.getAgeOfBirth = function(birth) {
      if (!birth) return;
      return AgeFactory.getAgeOfBith(birth);
    };

    // Remove existing Entry
    $scope.remove = function() {
      if ($window.confirm('Are you sure you want to delete?')) {
        $scope.entry.$remove($state.go('entries.list'));
      }
    };

    $scope.enableAsleepBtn = function() {
      $scope.enableAsleep = true;
    };

    $scope.enableAwakeBtn = function() {
      if ($scope.enableAsleep) {
        $scope.enableAwake = true;
        $scope.calcSleepDuration();
      }
    };

    // Save Entry
    $scope.save = function(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', '$scope.form.entryForm');
        return false;
      }
      $scope.isLoading = true;

      $scope.entry.time = $scope.primary_entry.hour + ':' + $scope.primary_entry.minute + ' ' + $scope.primary_entry.type;
      var hours = /am/i.test($scope.primary_entry.type) ? parseInt($scope.primary_entry.hour % 12, 10) : parseInt($scope.primary_entry.hour % 12, 10) + 12;
      $scope.entry.date.setHours(parseInt(hours, 10));
      $scope.entry.date.setMinutes(parseInt($scope.primary_entry.minute, 10));
      $scope.entry.date.setSeconds(0);
      $scope.entry.date.setMilliseconds(0);
      $scope.entry.date_string = $scope.entry.date.getFullYear() + '-' + ($scope.entry.date.getMonth() + 1) + '-' + $scope.entry.date.getDate();

      if ($scope.entry.type=='nursing' || $scope.entry.type=="pumping") {
        $scope.entry.leftLast = $scope.lastSide=="left"?true:false;
        $scope.entry.rightLast = $scope.lastSide=="right"?true:false;
        if ($scope.eventDuration.left.indexOf(':') < 0) {
          $scope.eventDuration.left = $scope.eventDuration.left.substr(0, 2) + ':' + $scope.eventDuration.left.substr(2);
        }
        if ($scope.eventDuration.right.indexOf(':') < 0) {
          $scope.eventDuration.right = $scope.eventDuration.right.substr(0, 2) + ':' + $scope.eventDuration.right.substr(2);
        }
        $scope.entry.leftDuration = $scope.eventDuration.left;
        $scope.entry.rightDuration = $scope.eventDuration.right;
      }

      if($scope.isSleepType && $scope.enableAwake) {
        $scope.awakeEntry.time = $scope.secondary_entry.hour + ':' + $scope.secondary_entry.minute + ' ' + $scope.secondary_entry.type;
        var secondaryHours = /am/i.test($scope.secondary_entry.type) ? parseInt($scope.secondary_entry.hour % 12, 10) : parseInt($scope.secondary_entry.hour % 12, 10) + 12;
        $scope.awakeEntry.date.setHours(parseInt(secondaryHours, 10));
        $scope.awakeEntry.date.setMinutes(parseInt($scope.secondary_entry.minute, 10));
        $scope.awakeEntry.date.setSeconds(0);
        $scope.awakeEntry.date.setMilliseconds(0);

        if($scope.entry.date >= $scope.awakeEntry.date) {
          $scope.isLoading = false;
          $scope.error = "Asleep entry should be before Awake entry.";
          Notification.error({ message: $scope.error });
        } else {
          if ($scope.entry._id) {
            $scope.entry.$update(successCallback, errorCallback);
          } else {
            $scope.entry.$save(successCallback, errorCallback);
          }
        }
      } else {
        if ($scope.entry._id) {
          $scope.entry.$update(successCallback, errorCallback);
        } else {
          $scope.entry.$save(successCallback, errorCallback);
        }
      }

      function successCallback(res) {
        if ($scope.isSleepType && $scope.enableAwake) {
          $scope.awakeEntry.time = $scope.secondary_entry.hour + ':' + $scope.secondary_entry.minute + ' ' + $scope.secondary_entry.type;
          var secondaryHours = /am/i.test($scope.secondary_entry.type) ? parseInt($scope.secondary_entry.hour % 12, 10) : parseInt($scope.secondary_entry.hour % 12, 10) + 12;
          $scope.awakeEntry.date.setHours(parseInt(secondaryHours, 10));
          $scope.awakeEntry.date.setMinutes(parseInt($scope.secondary_entry.minute, 10));
          $scope.awakeEntry.date.setSeconds(0);
          $scope.awakeEntry.date.setMilliseconds(0);
          $scope.awakeEntry.date_string = $scope.awakeEntry.date.getFullYear() + '-' + ($scope.awakeEntry.date.getMonth() + 1) + '-' + $scope.awakeEntry.date.getDate();
          if ($scope.awakeEntry._id) {
            $scope.awakeEntry.$update(finishCallback, errorCallback);
          } else {
            $scope.awakeEntry.$save(finishCallback, errorCallback);
          }
        } else {
          finishCallback();
        }
      }

      function finishCallback(res) {
        $scope.isLoading = false;
        if ($scope.pageState === 'dailyreports') {
          $state.go('dailyreports', { date: $scope.reportDate, childIndex: $scope.childIndex });
        } else {
          $state.go('child-landing', { childIndex: $scope.childIndex });
        }
      }

      function errorCallback(res) {
        $scope.isLoading = false;
        $scope.error = res.data.message;
      }
    };

    $scope.deleteEntry = function(ev) {
      var confirm = $mdDialog.confirm()
        .title('')
        .textContent('Are you sure you want to permanently delete this entry?')
        .ariaLabel(' ')
        .targetEvent(ev)
        .ok('Yes')
        .cancel('No');

      $mdDialog.show(confirm).then(function() {
        $scope.entry.$remove(function() {
          if ($scope.isSleepType && $scope.enableAwake) {
            $scope.awakeEntry.$remove(function() {
              Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> This entry has been deleted successfully!' });
              if ($scope.pageState === 'dailyreports') {
                $state.go('dailyreports', { date: $scope.reportDate, childIndex: $scope.childIndex });
              } else {
                $state.go('child-landing', { childIndex: $scope.childIndex });
              }
            });
          } else {
            Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> This entry has been deleted successfully!' });
            if ($scope.pageState === 'dailyreports') {
              $state.go('dailyreports', { date: $scope.reportDate, childIndex: $scope.childIndex });
            } else {
              $state.go('child-landing', { childIndex: $scope.childIndex });
            }
          }
        });
      }, function() {

      });
    };

    $scope.cancelEntryEdit = function() {
      if ($scope.pageState === 'dailyreports') {
        $state.go('dailyreports', { date: $scope.reportDate, childIndex: $scope.childIndex });
      } else {
        $state.go('child-landing', { childIndex: $scope.childIndex });
      }
    };
    var interval;
    $scope.sideBtnClickEvent = function(side) {
      var tmp = $scope.eventBtnClickCount[side];
      $scope.eventBtnClickCount = {
        left: 0,
        right: 0
      };
      $scope.eventBtnClickCount[side] = ++tmp;
      $scope.lastSide = side;

      if ($scope.eventBtnClickCount[side] > 0 && $scope.eventBtnClickCount[side] % 2 == 1) {
        interval = setInterval(function() {
          var duration = $scope.eventDuration[side].split(':');
          var min = parseInt(duration[0]);
          var sec = parseInt(duration[1]);
          sec++;
          if (sec == 60) {
            sec = 0;
            min++;
          }
          $scope.eventDuration[side] = (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec);

          duration = $scope.eventDuration.total.split(':');
          min = parseInt(duration[0]);
          sec = parseInt(duration[1]);
          sec++;
          if (sec == 60) {
            sec = 0;
            min++;
          }
          //$scope.eventDuration.total = (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec);
          $scope.$apply()
        }, 1000);
      } else if ($scope.eventBtnClickCount[side] > 0 && $scope.eventBtnClickCount[side] % 2 == 0) {
        clearInterval(interval)
      }
    };

    $scope.$watch('eventDuration.left', function(newVal, oldVal) {
      if (newVal) {
        if (newVal.indexOf(':') < 0) {
          newVal = newVal.substr(0, 2) + ':' + newVal.substr(2);
        }
        var leftDurationMin = parseInt(newVal.split(':')[0]);
        var leftDurationSec = parseInt(newVal.split(':')[1]);
        if ($scope.eventDuration.right.indexOf(':') < 0) {
          $scope.eventDuration.right = $scope.eventDuration.right.substr(0, 2) + ':' + $scope.eventDuration.right.substr(2);
        }
        var rightDurationMin = parseInt($scope.eventDuration.right.split(':')[0]);
        var rightDurationSec = parseInt($scope.eventDuration.right.split(':')[1]);
        var totalDurationMin =leftDurationMin + rightDurationMin;
        var totalDurationSec = leftDurationSec + rightDurationSec;
        totalDurationMin = totalDurationMin + parseInt(totalDurationSec / 60);
        totalDurationSec = totalDurationSec % 60;
        $scope.eventDuration.total = (totalDurationMin < 10 ? "0" + totalDurationMin : totalDurationMin) + ":" + (totalDurationSec < 10 ? "0" + totalDurationSec : totalDurationSec);
      }
    });

    $scope.$watch('eventDuration.right', function(newVal, oldVal) {
      if (newVal) {
        if ($scope.eventDuration.left.indexOf(':') < 0) {
          $scope.eventDuration.left = $scope.eventDuration.left.substr(0, 2) + ':' + $scope.eventDuration.left.substr(2);
        }
        var leftDurationMin = parseInt($scope.eventDuration.left.split(':')[0]);
        var leftDurationSec = parseInt($scope.eventDuration.left.split(':')[1]);
        if (newVal.indexOf(':') < 0) {
          newVal = newVal.substr(0, 2) + ':' + newVal.substr(2);
        }
        var rightDurationMin = parseInt(newVal.split(':')[0]);
        var rightDurationSec = parseInt(newVal.split(':')[1]);
        var totalDurationMin =leftDurationMin + rightDurationMin;
        var totalDurationSec = leftDurationSec + rightDurationSec;
        totalDurationMin = totalDurationMin + parseInt(totalDurationSec / 60);
        totalDurationSec = totalDurationSec % 60;
        $scope.eventDuration.total = (totalDurationMin < 10 ? "0" + totalDurationMin : totalDurationMin) + ":" + (totalDurationSec < 10 ? "0" + totalDurationSec : totalDurationSec);
      }
    });

    $scope.changeLastSide = function() {
      $scope.lastSide = $scope.entry.entry_manual_last;
    };

    $scope.editDurationManual = function(val) {
      $scope.manualEdit = val;
      if (!$scope.manualEdit) {
        $scope.eventDuration.left = ($scope.manualDuration.leftMinute<10?'0'+$scope.manualDuration.leftMinute:$scope.manualDuration.leftMinute)+ ':' 
          + ($scope.manualDuration.leftSecond<10?'0'+$scope.manualDuration.leftSecond:$scope.manualDuration.leftSecond);
        $scope.eventDuration.right = ($scope.manualDuration.rightMinute<10?'0'+$scope.manualDuration.rightMinute:$scope.manualDuration.rightMinute)+ ':' 
          + ($scope.manualDuration.rightSecond<10?'0'+$scope.manualDuration.rightSecond:$scope.manualDuration.rightSecond);
      } else {
        $scope.manualDuration.leftMinute = parseInt($scope.eventDuration.left.substr(0, 2));
        $scope.manualDuration.leftSecond = parseInt($scope.eventDuration.left.substr(3));
        $scope.manualDuration.rightMinute = parseInt($scope.eventDuration.right.substr(0, 2));
        $scope.manualDuration.rightSecond = parseInt($scope.eventDuration.right.substr(3));
        $scope.entry.entry_manual_last = $scope.lastSide;
      }
    };
    
    $scope.selectManualTime = function() {
      $scope.eventDuration.left = ($scope.manualDuration.leftMinute<10?'0'+$scope.manualDuration.leftMinute:$scope.manualDuration.leftMinute)+ ':' 
          + ($scope.manualDuration.leftSecond<10?'0'+$scope.manualDuration.leftSecond:$scope.manualDuration.leftSecond);
      $scope.eventDuration.right = ($scope.manualDuration.rightMinute<10?'0'+$scope.manualDuration.rightMinute:$scope.manualDuration.rightMinute)+ ':' 
          + ($scope.manualDuration.rightSecond<10?'0'+$scope.manualDuration.rightSecond:$scope.manualDuration.rightSecond);
    };

    $scope.navigatePage = function(state) {
      $state.go(state, { childIndex: $scope.childIndex });
    };

    $scope.editBottleContents = function(e) {
      $mdDialog.show({
        controller: BottleContentsFormModalController,
        templateUrl: 'modules/entries/client/views/bottle_contents.modal.client.view.html',
        parent: angular.element(document.body),
        targetEvent: e,
        clickOutsideToClose: true,
        locals: {
          child: child,
          user: vm.authentication.user
        }
      }).then(function (response) {
        $scope.bottleContents = ['Breastmilk', 'Dairy Milk', 'Formula'];
        $scope.bottleContents = $scope.bottleContents.concat(response.bottleContents||[]);
        if ($scope.bottleContents.indexOf(null) > -1) {
          $scope.bottleContents.splice($scope.bottleContents.indexOf(null), 1);
        }
      }, function () {});
    };

    $scope.editEntry = function(event, entry) {
      $state.go('entries.edit', { childId: entry.child, entryId: entry._id, type: entry.type, childIndex: $scope.childIndex });
    };

    $scope.editChildLabel = function(e) {
      $mdDialog.show({
        controller: ChildFormModalController,
        templateUrl: 'modules/babysettings/client/views/childform.modal.client.view.html',
        parent: angular.element(document.body),
        targetEvent: e,
        clickOutsideToClose: true,
        locals: {
          child: child,
          user: vm.authentication.user
        }
      }).then(function (response) {
        if (child) {
          Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> ' + child.firstName + ' ' + child.lastName + '\'s data has been updated successfully.' });
        } else {
          vm.childlist.unshift(response);
          Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> New child has been saved successfully.' });
        }
      }, function () {});
    };

    // Child Form Modal Controller
    function ChildFormModalController($scope, $mdDialog, $timeout, Upload, Notification, locals) {

      $scope.title = locals.child ? 'Edit child' : 'Add child';
      $scope.user = locals.user;

      var now = new Date();

      $scope.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      $scope.dates_list = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      $scope.years = [];
      var i = 0;
      for (i = now.getFullYear() - 6; i < now.getFullYear() + 1; i++) {
        $scope.years.push(i);
      }

      $scope.hours = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
      $scope.minutes = ['00', '15', '30', '45'];
      $scope.time_type = ['AM', 'PM'];

      $scope.month = now.getMonth() + 1;
      $scope.date = now.getDate();
      if ($scope.date < 10) {
        $scope.date = '0' + $scope.date;
      } else {
        $scope.date = $scope.date;
      }

      $scope.year = now.getFullYear();

      $scope.dates = [];
      for (i = 1; i <= $scope.dates_list[$scope.month - 1]; i++) {
        if (i < 10) {
          $scope.dates.push('0' + i.toString());
        } else {
          $scope.dates.push(i.toString());
        }
      }

      if (locals.child) {
        $scope.child = locals.child;
        $scope.year = $scope.child.birthDay.split('/')[2];
        $scope.month = parseInt($scope.child.birthDay.split('/')[0], 10);
        $scope.date = $scope.child.birthDay.split('/')[1];
        if (!$scope.child.gender || $scope.child.gender == '') {
          $scope.child.gender = 'female';
        }
      } else {
        $scope.child = new ChildsService({
          firstName: '',
          lastName: '',
          birthDay: '',
          dayBeginsAt: formatAMPM(now),
          nightBeginsAt: formatAMPM(now),
          miscellaneous: '',
          gender: 'female'
        });
      }

      $scope.child.dayBeginsAt = $scope.child.dayBeginsAt ? $scope.child.dayBeginsAt : formatAMPM(now);
      $scope.child.nightBeginsAt = $scope.child.nightBeginsAt ? $scope.child.nightBeginsAt : formatAMPM(now);
      $scope.day_hour = $scope.child.dayBeginsAt.split(':')[0];
      $scope.day_minute = $scope.child.dayBeginsAt.split(':')[1].split(' ')[0];
      $scope.day_type = $scope.child.dayBeginsAt.split(':')[1].split(' ')[1];
      $scope.night_hour = $scope.child.nightBeginsAt.split(':')[0];
      $scope.night_minute = $scope.child.nightBeginsAt.split(':')[1].split(' ')[0];
      $scope.night_type = $scope.child.nightBeginsAt.split(':')[1].split(' ')[1];
      if (!locals.child) {
        $scope.day_type = 'AM';
        $scope.night_type = 'PM';
      }
      $scope.fileSelected = false;
      $scope.isLoading = false;
      $scope.changeMonth = function() {
        $scope.dates = [];
        for (var i = 1; i <= $scope.dates_list[$scope.month - 1]; i++) {
          if (i < 10) {
            $scope.dates.push('0' + i.toString());
          } else {
            $scope.dates.push(i.toString());
          }
        }
      };

      $scope.hide = function() {
        $mdDialog.hide();
      };

      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.save = function(isValid) {
        if (!isValid) {
          $scope.$broadcast('show-errors-check-validity', 'childForm');
          return false;
        }
        $scope.isLoading = true;
        if ($scope.month < 10) {
          $scope.child.birthDay = '0' + $scope.month + '/' + $scope.date + '/' + $scope.year;
        } else {
          $scope.child.birthDay = $scope.month + '/' + $scope.date + '/' + $scope.year;
        }
        $scope.child.dayBeginsAt = $scope.day_hour + ':' + $scope.day_minute + ' ' + $scope.day_type;
        $scope.child.nightBeginsAt = $scope.night_hour + ':' + $scope.night_minute + ' ' + $scope.night_type;
        if ($scope.child._id) {
          $scope.child.$update(successCallback, errorCallback);
        } else {
          $scope.child.$save(successCallback, errorCallback);
        }
      };
      $scope.removeChild = function (ev) {
        $mdDialog.show({
          controller: RemoveConfirmController,
          templateUrl: 'modules/core/client/views/remove-confirm.client.view.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: true,
          locals: {
            title: 'Confirm',
            content: 'Are you sure you want to delete this child?',
            subContent: 'All records for this child will be deleted from the BabyLogger app.',
            button1: 'Remove',
            button2: 'Cancel'
          }
        }).then(function() {
          $scope.child.$remove(function() {
            Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> ' + $scope.child.firstName + ' ' + $scope.child.lastName + ' has been deleted successfully!' });
            vm.childlist = ChildsService.query();
            vm.deviceList = DevicesService.query();
            vm.additionalUsers = AssociatedUserService.query();
          });
        }, function() {
          vm.showChildFormDialog(ev, $scope.child);
        });
      };
      $scope.upload = function (dataUrl, name) {
        Upload.upload({
          url: 'api/upload_photo',
          data: {
            newProfilePicture: Upload.dataUrltoBlob(dataUrl, name)
          }
        }).then(function (response) {
          $timeout(function () {
            onSuccessItem(response.data);
          });
        }, function (response) {
          if (response.status > 0) onErrorItem(response.data);
        }, function (evt) {
          $scope.progress = parseInt(100.0 * evt.loaded / evt.total, 10);
        });
      };

      // Called after the user has successfully uploaded a new picture
      function onSuccessItem(response) {
        // Show success message
        Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Upload photo successful!' });

        // Populate user object
        $scope.child.imageURL = response.imgPath;

        // Reset form
        $scope.fileSelected = false;
        $scope.progress = 0;
      }

      // Called after the user has failed to uploaded a new picture
      function onErrorItem(response) {
        $scope.fileSelected = false;

        // Show error message
        Notification.error({ message: response.message, title: '<i class="glyphicon glyphicon-remove"></i> Upload photo failed!' });
      }

      function successCallback(res) {
        $scope.isLoading = false;
        $mdDialog.hide(res);
      }

      function errorCallback(res) {
        $scope.isLoading = false;
        $scope.error = res.data.message;
        Notification.error({ message: '<i class="glyphicon glyphicon-remove"></i> ' + res.data.message });
      }

      function formatAMPM(date) {
        var hours = date.getHours();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        if (!hours) hours = 12;
        // hours = hours ? hours : 12; // the hour '0' should be '12'
        hours = hours < 10 ? '0' + hours : hours;
        var strTime = hours + ':00' + ' ' + ampm;
        return strTime;
      }
    }

    function RemoveConfirmController($scope, $mdDialog, locals) {
      $scope.title = locals.title;
      $scope.content = locals.content;
      $scope.subContent = locals.subContent;
      $scope.button1 = locals.button1;
      $scope.button2 = locals.button2;
      $scope.hide = function() {
        $mdDialog.hide();
      };

      $scope.cancel = function() {
        $mdDialog.cancel();
      };
    }

    function BottleContentsFormModalController($scope, $mdDialog, Notification, locals) {

      $scope.title = 'Edit Bottle Content Options';
      $scope.user = locals.user;

      $scope.child = locals.child;
      $scope.child.bottleContents = $scope.child.bottleContents || [];
      $scope.addNewBottleContent = function() {
        if ($scope.newBottleContent != "" && $scope.child.bottleContents.indexOf($scope.newBottleContent) < 0) {
          $scope.child.bottleContents.push($scope.newBottleContent);
          $scope.newBottleContent = "";
        }
      };
      $scope.removeBottleContent = function(item) {
        var index = $scope.child.bottleContents.indexOf(item);
        $scope.child.bottleContents.splice(index, 1);
      };
      $scope.hide = function() {
        $mdDialog.hide();
      };

      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.save = function(isValid) {
        $scope.isLoading = true;
        $scope.addNewBottleContent();
        $scope.child.$update(successCallback, errorCallback);
      };

      function successCallback(res) {
        $scope.isLoading = false;
        $mdDialog.hide(res);
      }

      function errorCallback(res) {
        $scope.isLoading = false;
        $scope.error = res.data.message;
        Notification.error({ message: '<i class="glyphicon glyphicon-remove"></i> ' + res.data.message });
      }
    }

    function formatAMPM(date) {
      var hours = date.getHours();
      var ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (!hours) hours = 12;
      // hours = hours ? hours : 12; // the hour '0' should be '12'
      hours = hours < 10 ? '0' + hours : hours;
      var minutes = date.getMinutes();
      minutes = minutes < 10 ? '0' + minutes : minutes;
      var strTime = hours + ':' + minutes + ' ' + ampm;
      return strTime;
    }
  }
}());
