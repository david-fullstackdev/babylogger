(function () {
  'use strict';

  describe('Childs Route Tests', function () {
    // Initialize global variables
    var $scope,
      ChildsService;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _ChildsService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      ChildsService = _ChildsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('childs');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/childs');
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
          ChildsController,
          mockChild;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('childs.view');
          $templateCache.put('modules/childs/client/views/view-child.client.view.html', '');

          // create mock Child
          mockChild = new ChildsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Child Name'
          });

          // Initialize Controller
          ChildsController = $controller('ChildsController as vm', {
            $scope: $scope,
            childResolve: mockChild
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:childId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.childResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            childId: 1
          })).toEqual('/childs/1');
        }));

        it('should attach an Child to the controller scope', function () {
          expect($scope.vm.child._id).toBe(mockChild._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('modules/childs/client/views/view-child.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          ChildsController,
          mockChild;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('childs.create');
          $templateCache.put('modules/childs/client/views/form-child.client.view.html', '');

          // create mock Child
          mockChild = new ChildsService();

          // Initialize Controller
          ChildsController = $controller('ChildsController as vm', {
            $scope: $scope,
            childResolve: mockChild
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.childResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/childs/create');
        }));

        it('should attach an Child to the controller scope', function () {
          expect($scope.vm.child._id).toBe(mockChild._id);
          expect($scope.vm.child._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('modules/childs/client/views/form-child.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          ChildsController,
          mockChild;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('childs.edit');
          $templateCache.put('modules/childs/client/views/form-child.client.view.html', '');

          // create mock Child
          mockChild = new ChildsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Child Name'
          });

          // Initialize Controller
          ChildsController = $controller('ChildsController as vm', {
            $scope: $scope,
            childResolve: mockChild
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:childId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.childResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            childId: 1
          })).toEqual('/childs/1/edit');
        }));

        it('should attach an Child to the controller scope', function () {
          expect($scope.vm.child._id).toBe(mockChild._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('modules/childs/client/views/form-child.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
}());
