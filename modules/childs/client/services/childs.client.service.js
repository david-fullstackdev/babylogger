// Childs service used to communicate Childs REST endpoints
(function () {
  'use strict';

  angular
    .module('childs')
    .factory('ChildsService', ChildsService)
    .factory('AgeFactory', AgeFactory);

  ChildsService.$inject = ['$resource'];
  AgeFactory.$inject = [];

  function ChildsService($resource) {
    return $resource('api/childs/:childId', {
      childId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }

  function AgeFactory() {
    return {
      getAgeOfBith: function(birth) {
        var now = new Date();
        var ms = moment(now, 'DD/MM/YYYY HH:mm:ss').diff(moment(new Date(birth), 'DD/MM/YYYY HH:mm:ss'));
        var d = moment.duration(ms);
        var months = d.format('M');
        var days = d.format('d');
        var years = d.format('y');
        var age = d.format('M [m] d [d old]');
        return age;
      }
    };
  }
}());
