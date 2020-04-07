(function () {
  'use strict';

  angular
    .module('babysettings')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    // Set top bar menu items
    menuService.addMenuItem('topbar', {
      title: 'Settings',
      state: 'babysettings',
      roles: ['user']
    });
  }
}());
