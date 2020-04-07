(function () {
  'use strict';

  // Babysettings controller
  angular
    .module('babysettings')
    .controller('BabysettingsController', BabysettingsController);

  BabysettingsController.$inject = ['$scope', '$state', '$window', 'Authentication', '$mdDialog', 'ChildsService', 'AssociatedUserService', 'DevicesService', 'Upload', 'Notification'];

  function BabysettingsController ($scope, $state, $window, Authentication, $mdDialog, ChildsService, AssociatedUserService, DevicesService, Upload, Notification) {
    var vm = this;
    vm.authentication = Authentication;
    if (!vm.authentication.user) return $state.go('authentication.signin');
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;
    vm.childlist = ChildsService.query();
    vm.additionalUsers = AssociatedUserService.query();
    vm.deviceList = DevicesService.query();
    // Remove existing Babysetting
    function remove() {
      if ($window.confirm('Are you sure you want to delete?')) {
        vm.babysetting.$remove($state.go('babysettings.list'));
      }
    }

    // Save Babysetting
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.babysettingForm');
        return false;
      }

      // TODO: move create/update logic to service
      if (vm.babysetting._id) {
        vm.babysetting.$update(successCallback, errorCallback);
      } else {
        vm.babysetting.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('babysettings.view', {
          babysettingId: res._id
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }

    vm.showDeviceConfigureDialog = function(e, device) {
      $mdDialog.show({
        controller: DeviceConfigController,
        templateUrl: 'modules/babysettings/client/views/deviceconfig.modal.client.view.html',
        parent: angular.element(document.body),
        targetEvent: e,
        clickOutsideToClose: true,
        locals: {
          title: 'Device Configuration',
          user: vm.authentication.user,
          device: device
        }
      }).then(function (response) {
        device = response;
        Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Configuration data for ' + device.deviceId + ' has been set successfully.' });
        vm.deviceList = DevicesService.query();
      }, function () {});
    };

    vm.showChildFormDialog = function(e, child) {
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

    vm.showAssociatedUserDialog = function(e, associatedUser) {
      $mdDialog.show({
        controller: AssociatedUserModalController,
        templateUrl: 'modules/babysettings/client/views/usermodal.client.view.html',
        parent: angular.element(document.body),
        targetEvent: e,
        clickOutsideToClose: true,
        locals: {
          title: 'Add User',
          user: vm.authentication.user,
          associatedUser: associatedUser
        }
      }).then(function (response) {
        if (associatedUser) {
          Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> ' + associatedUser.firstName + ' ' + associatedUser.lastName + '\'s data has been updated successfully.' });
        } else {
          vm.additionalUsers.unshift(response);
          Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> An additional user has been created successfully.' });
        }
      }, function () {});
    };

    vm.editProfile = function(e) {
      $mdDialog.show({
        controller: UserProfileModalController,
        templateUrl: 'modules/babysettings/client/views/profilemodal.client.view.html',
        parent: angular.element(document.body),
        targetEvent: e,
        clickOutsideToClose: true,
        locals: {
          title: 'Edit User',
          user: vm.authentication.user
        }
      }).then(function (response) {
        vm.authentication.user = response;
        Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> ' + vm.authentication.user.displayName + '\'s profile has been updated successfully.' });
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
    // Device Configure Modal Controller
    function DeviceConfigController($scope, $mdDialog, Notification, locals) {
      $scope.title = locals.title;
      $scope.user = locals.user;
      $scope.device = locals.device;
      $scope.childs = ChildsService.query();
      $scope.fileSelected = false;
      $scope.isLoading = false;
      $scope.hide = function() {
        $mdDialog.hide();
      };

      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.save = function(isValid) {
        if (!isValid) {
          $scope.$broadcast('show-errors-check-validity', 'deviceConfigForm');

          return false;
        }
        $scope.isLoading = true;
        $scope.device.$update(successCallback, errorCallback);

        function successCallback(res) {
          $scope.isLoading = false;
          $mdDialog.hide(res);
        }

        function errorCallback(res) {
          $scope.isLoading = false;
          $scope.error = res.data.message;
          Notification.error({ message: '<i class="glyphicon glyphicon-remove"></i> ' + res.data.message });
        }
      };
    }

    // Associated User Modal Controller
    function AssociatedUserModalController($scope, $mdDialog, $filter, Notification, UserPwdResetService, locals, timezoneFactory, zoneToCC, CCToCountryName) {
      var data = [];
      var timezones = timezoneFactory.get();

      // Group the timezones by their country code
      var timezonesGroupedByCC = {};
      _.forEach(timezones, function (timezone) {
        if (_.has(zoneToCC, timezone.id)) {
          var CC = zoneToCC[timezone.id];
          timezonesGroupedByCC[CC] = !timezonesGroupedByCC[CC] ? [] : timezonesGroupedByCC[CC];
          timezonesGroupedByCC[CC].push(timezone);
        }
      });

      // Add the grouped countries to the data array with their country name as the group option
      _.forEach(timezonesGroupedByCC, function (zonesByCountry, CC) {
        var zonesForCountry = {
          text: CCToCountryName[CC] + ': ',
          children: zonesByCountry,
          firstNOffset: zonesByCountry[0].nOffset
        };
        data.push(zonesForCountry);
      });
      $scope.countries = _.map(CCToCountryName, function (key, idx) { return { country: key, code: idx }; });
      data = _.sortBy(data, 'firstNOffset');
      _.forEach(data, function (zonesForCountry, key) {
        zonesForCountry.children = _.sortBy(zonesForCountry.children, 'nOffset');
      });
      $scope.timezone_list = data;
      $scope.title = locals.title;
      $scope.user = locals.user;
      $scope.isLoading = false;

      if (locals.associatedUser) {
        $scope.associatedUser = locals.associatedUser;
      } else {
        $scope.associatedUser = new AssociatedUserService({
          firstName: '',
          lastName: '',
          email: '',
          username: '',
          children: [],
          roles: ['associate']
        });
      }
      $scope.associatedUser.roles = $scope.associatedUser.roles[0];
      $scope.childs = ChildsService.query();
      $scope.childs.$promise.then(function (result) {
        for (var i = 0; i < $scope.childs.length; i++) {
          var selectedChild = $filter('filter')($scope.associatedUser.children, { _id: $scope.childs[i]._id });
          if (selectedChild.length > 0) {
            $scope.childs[i].isSelected = true;
          }
        }
      });
      $scope.hide = function() {
        $mdDialog.hide();
      };

      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.save = function(isValid) {
        if (!isValid) {
          $scope.$broadcast('show-errors-check-validity', 'associateUserForm');

          return false;
        }
        $scope.isLoading = true;
        $scope.associatedUser.children = [];
        var selectedChilds = $filter('filter')($scope.childs, { isSelected: true });
        for (var i = 0; i < selectedChilds.length; i++) {
          $scope.associatedUser.children.push(selectedChilds[i]);
        }

        $scope.associatedUser.roles = [$scope.associatedUser.roles];
        if ($scope.associatedUser._id) {
          $scope.associatedUser.$update(successCallback, errorCallback);
        } else {
          $scope.associatedUser.$save(successCallback, errorCallback);
        }
      };

      $scope.deleteAssociatedUser = function(ev) {
        $mdDialog.show({
          controller: RemoveConfirmController,
          templateUrl: 'modules/core/client/views/remove-confirm.client.view.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: true,
          locals: {
            title: 'Confirm',
            content: 'Are you sure you want to delete this user?',
            subContent: 'He/she will no longer have access to enter data or view reports for the children associated with his or her account.',
            button1: 'Remove',
            button2: 'Cancel'
          }
        }).then(function() {
          $scope.associatedUser.$remove(function() {
            Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> ' + $scope.associatedUser.displayName + ' has been deleted successfully!' });
            vm.additionalUsers = AssociatedUserService.query();
          });
        }, function() {
          vm.showAssociatedUserDialog(ev, $scope.associatedUser);
        });
      };

      $scope.resetAssociatedUserPwd = function(ev) {
        $mdDialog.show({
          controller: RemoveConfirmController,
          templateUrl: 'modules/core/client/views/remove-confirm.client.view.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: true,
          locals: {
            title: 'Reset Password',
            content: 'This user will receive an email with a link to reset their password.',
            subContent: '',
            button1: 'OK',
            button2: 'Cancel'
          }
        }).then(function() {
          UserPwdResetService.reset($scope.associatedUser).then(function(res) {
            vm.showAssociatedUserDialog(ev, $scope.associatedUser);
            Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> ' + res.data.message });
          }, function(errorResponse) {
            vm.showAssociatedUserDialog(ev, $scope.associatedUser);
            Notification.error({ message: '<i class="glyphicon glyphicon-remove"></i> ' + errorResponse.data.message });
          });
        }, function() {
          vm.showAssociatedUserDialog(ev, $scope.associatedUser);
        });
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

    function UserProfileModalController($scope, $mdDialog, Notification, UsersService, locals) {
      $scope.title = locals.title;
      $scope.user = locals.user;
      $scope.isLoading = false;

      $scope.hide = function() {
        $mdDialog.hide();
      };

      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.save = function(isValid) {
        if (!isValid) {
          $scope.$broadcast('show-errors-check-validity', 'userProfileForm');

          return false;
        }
        $scope.isLoading = true;
        UsersService.updateuserProfile($scope.user)
          .then(successCallback)
          .catch(errorCallback);
      };

      $scope.resetPrimaryUserPwd = function(ev) {
        $mdDialog.show({
          controller: RemoveConfirmController,
          templateUrl: 'modules/core/client/views/remove-confirm.client.view.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: true,
          locals: {
            title: 'Reset Password',
            content: 'You will receive an email with a link to reset your password.',
            subContent: '',
            button1: 'OK',
            button2: 'Cancel'
          }
        }).then(function () {
          UsersService.resetPrimaryUserPassword().then(function (res) {
            vm.editProfile(ev);
            Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> ' + res.data.message });
          }, function (errorResponse) {
            vm.editProfile(ev);
            Notification.error({ message: '<i class="glyphicon glyphicon-remove"></i> ' + errorResponse.data.message });
          });
        }, function () {
          vm.editProfile(ev);
        });
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
  }
}());
