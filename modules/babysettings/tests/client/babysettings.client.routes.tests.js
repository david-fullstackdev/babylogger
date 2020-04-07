(function () {
  'use strict';

  describe('Babysettings Route Tests', function () {
    // Initialize global variables
    var $scope,
      BabysettingsService;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _BabysettingsService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      BabysettingsService = _BabysettingsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('babysettings');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/babysettings');
        });

        it('Should be abstract', function () {
          expect(mainstate.abstract).toBe(true);
        });

        it('Should have template', function () {
          expect(mainstate.template).toBe('<ui-view/>');
        });
      });

      describe('View Route', function () {
        var viewstate,
          BabysettingsController,
          mockBabysetting;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('babysettings.view');
          $templateCache.put('modules/babysettings/client/views/view-babysetting.client.view.html', '');

          // create mock Babysetting
          mockBabysetting = new BabysettingsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Babysetting Name'
          });

          // Initialize Controller
          BabysettingsController = $controller('BabysettingsController as vm', {
            $scope: $scope,
            babysettingResolve: mockBabysetting
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:babysettingId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.babysettingResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            babysettingId: 1
          })).toEqual('/babysettings/1');
        }));

        it('should attach an Babysetting to the controller scope', function () {
          expect($scope.vm.babysetting._id).toBe(mockBabysetting._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('modules/babysettings/client/views/view-babysetting.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          BabysettingsController,
          mockBabysetting;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('babysettings.create');
          $templateCache.put('modules/babysettings/client/views/form-babysetting.client.view.html', '');

          // create mock Babysetting
          mockBabysetting = new BabysettingsService();

          // Initialize Controller
          BabysettingsController = $controller('BabysettingsController as vm', {
            $scope: $scope,
            babysettingResolve: mockBabysetting
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.babysettingResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/babysettings/create');
        }));

        it('should attach an Babysetting to the controller scope', function () {
          expect($scope.vm.babysetting._id).toBe(mockBabysetting._id);
          expect($scope.vm.babysetting._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('modules/babysettings/client/views/form-babysetting.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          BabysettingsController,
          mockBabysetting;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('babysettings.edit');
          $templateCache.put('modules/babysettings/client/views/form-babysetting.client.view.html', '');

          // create mock Babysetting
          mockBabysetting = new BabysettingsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Babysetting Name'
          });

          // Initialize Controller
          BabysettingsController = $controller('BabysettingsController as vm', {
            $scope: $scope,
            babysettingResolve: mockBabysetting
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:babysettingId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.babysettingResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            babysettingId: 1
          })).toEqual('/babysettings/1/edit');
        }));

        it('should attach an Babysetting to the controller scope', function () {
          expect($scope.vm.babysetting._id).toBe(mockBabysetting._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('modules/babysettings/client/views/form-babysetting.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
}());
