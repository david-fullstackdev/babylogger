(function () {
  'use strict';

  angular
    .module('childs')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    // Set top bar menu items
    /* menuService.addMenuItem('topbar', {
      title: 'Childs',
      state: 'childs',
      roles: ['user', 'associate']
    });*/
  }
}());
