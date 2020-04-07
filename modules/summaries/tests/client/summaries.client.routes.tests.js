(function () {
  'use strict';

  describe('Summaries Route Tests', function () {
    // Initialize global variables
    var $scope,
      SummariesService;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _SummariesService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      SummariesService = _SummariesService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('summaries');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/summaries');
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
          SummariesController,
          mockSummary;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('summaries.view');
          $templateCache.put('modules/summaries/client/views/view-summary.client.view.html', '');

          // create mock Summary
          mockSummary = new SummariesService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Summary Name'
          });

          // Initialize Controller
          SummariesController = $controller('SummariesController as vm', {
            $scope: $scope,
            summaryResolve: mockSummary
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:summaryId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.summaryResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            summaryId: 1
          })).toEqual('/summaries/1');
        }));

        it('should attach an Summary to the controller scope', function () {
          expect($scope.vm.summary._id).toBe(mockSummary._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('modules/summaries/client/views/view-summary.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          SummariesController,
          mockSummary;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('summaries.create');
          $templateCache.put('modules/summaries/client/views/form-summary.client.view.html', '');

          // create mock Summary
          mockSummary = new SummariesService();

          // Initialize Controller
          SummariesController = $controller('SummariesController as vm', {
            $scope: $scope,
            summaryResolve: mockSummary
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.summaryResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/summaries/create');
        }));

        it('should attach an Summary to the controller scope', function () {
          expect($scope.vm.summary._id).toBe(mockSummary._id);
          expect($scope.vm.summary._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('modules/summaries/client/views/form-summary.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          SummariesController,
          mockSummary;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('summaries.edit');
          $templateCache.put('modules/summaries/client/views/form-summary.client.view.html', '');

          // create mock Summary
          mockSummary = new SummariesService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Summary Name'
          });

          // Initialize Controller
          SummariesController = $controller('SummariesController as vm', {
            $scope: $scope,
            summaryResolve: mockSummary
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:summaryId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.summaryResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            summaryId: 1
          })).toEqual('/summaries/1/edit');
        }));

        it('should attach an Summary to the controller scope', function () {
          expect($scope.vm.summary._id).toBe(mockSummary._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('modules/summaries/client/views/form-summary.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
}());
