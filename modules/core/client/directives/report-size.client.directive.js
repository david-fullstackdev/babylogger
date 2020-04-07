(function () {
  'use strict';

  angular.module('core')
    .directive('reportSize', reportSize);

  reportSize.$inject = ['$rootScope', '$interpolate', '$window'];

  function reportSize($rootScope, $interpolate, $window) {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link(scope, element) {
      var w = angular.element($window);
      scope.getWindowDimensions = function () {
        return {
          'w': $window.innerWidth
        };
      };
      scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
        scope.windowWidth = newValue.w;

        scope.style = function () {
          return {
            'width': (newValue.w - 115) + 'px'
          };
        };

      }, true);

      w.bind('resize', function () {
        scope.$apply();
      });
    }
  }
}());
