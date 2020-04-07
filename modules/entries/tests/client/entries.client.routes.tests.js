(function () {
  'use strict';

  describe('Entries Route Tests', function () {
    // Initialize global variables
    var $scope,
      EntriesService;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _EntriesService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      EntriesService = _EntriesService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('entries');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/entries');
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
          EntriesController,
          mockEntry;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('entries.view');
          $templateCache.put('modules/entries/client/views/view-entry.client.view.html', '');

          // create mock Entry
          mockEntry = new EntriesService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Entry Name'
          });

          // Initialize Controller
          EntriesController = $controller('EntriesController as vm', {
            $scope: $scope,
            entryResolve: mockEntry
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:entryId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.entryResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            entryId: 1
          })).toEqual('/entries/1');
        }));

        it('should attach an Entry to the controller scope', function () {
          expect($scope.vm.entry._id).toBe(mockEntry._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('modules/entries/client/views/view-entry.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          EntriesController,
          mockEntry;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('entries.create');
          $templateCache.put('modules/entries/client/views/form-entry.client.view.html', '');

          // create mock Entry
          mockEntry = new EntriesService();

          // Initialize Controller
          EntriesController = $controller('EntriesController as vm', {
            $scope: $scope,
            entryResolve: mockEntry
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.entryResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/entries/create');
        }));

        it('should attach an Entry to the controller scope', function () {
          expect($scope.vm.entry._id).toBe(mockEntry._id);
          expect($scope.vm.entry._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('modules/entries/client/views/form-entry.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          EntriesController,
          mockEntry;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('entries.edit');
          $templateCache.put('modules/entries/client/views/form-entry.client.view.html', '');

          // create mock Entry
          mockEntry = new EntriesService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Entry Name'
          });

          // Initialize Controller
          EntriesController = $controller('EntriesController as vm', {
            $scope: $scope,
            entryResolve: mockEntry
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:entryId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.entryResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            entryId: 1
          })).toEqual('/entries/1/edit');
        }));

        it('should attach an Entry to the controller scope', function () {
          expect($scope.vm.entry._id).toBe(mockEntry._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('modules/entries/client/views/form-entry.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
}());
