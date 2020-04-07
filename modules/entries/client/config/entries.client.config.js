(function () {
  'use strict';

  angular
    .module('entries')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    // Set top bar menu items
    /* menuService.addMenuItem('topbar', {
      title: 'Entries',
      state: 'entries',
      roles: ['user', ['associate']]
    });*/
  }
}());
