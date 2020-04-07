(function () {
  'use strict';

  describe('Dailyreports Route Tests', function () {
    // Initialize global variables
    var $scope,
      DailyreportsService;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _DailyreportsService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      DailyreportsService = _DailyreportsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('dailyreports');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/dailyreports');
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
          DailyreportsController,
          mockDailyreport;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('dailyreports.view');
          $templateCache.put('modules/dailyreports/client/views/view-dailyreport.client.view.html', '');

          // create mock Dailyreport
          mockDailyreport = new DailyreportsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Dailyreport Name'
          });

          // Initialize Controller
          DailyreportsController = $controller('DailyreportsController as vm', {
            $scope: $scope,
            dailyreportResolve: mockDailyreport
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:dailyreportId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.dailyreportResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            dailyreportId: 1
          })).toEqual('/dailyreports/1');
        }));

        it('should attach an Dailyreport to the controller scope', function () {
          expect($scope.vm.dailyreport._id).toBe(mockDailyreport._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('modules/dailyreports/client/views/view-dailyreport.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          DailyreportsController,
          mockDailyreport;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('dailyreports.create');
          $templateCache.put('modules/dailyreports/client/views/form-dailyreport.client.view.html', '');

          // create mock Dailyreport
          mockDailyreport = new DailyreportsService();

          // Initialize Controller
          DailyreportsController = $controller('DailyreportsController as vm', {
            $scope: $scope,
            dailyreportResolve: mockDailyreport
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.dailyreportResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/dailyreports/create');
        }));

        it('should attach an Dailyreport to the controller scope', function () {
          expect($scope.vm.dailyreport._id).toBe(mockDailyreport._id);
          expect($scope.vm.dailyreport._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('modules/dailyreports/client/views/form-dailyreport.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          DailyreportsController,
          mockDailyreport;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('dailyreports.edit');
          $templateCache.put('modules/dailyreports/client/views/form-dailyreport.client.view.html', '');

          // create mock Dailyreport
          mockDailyreport = new DailyreportsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Dailyreport Name'
          });

          // Initialize Controller
          DailyreportsController = $controller('DailyreportsController as vm', {
            $scope: $scope,
            dailyreportResolve: mockDailyreport
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:dailyreportId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.dailyreportResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            dailyreportId: 1
          })).toEqual('/dailyreports/1/edit');
        }));

        it('should attach an Dailyreport to the controller scope', function () {
          expect($scope.vm.dailyreport._id).toBe(mockDailyreport._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('modules/dailyreports/client/views/form-dailyreport.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
}());
