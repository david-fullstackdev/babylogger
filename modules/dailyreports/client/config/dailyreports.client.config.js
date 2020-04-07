(function () {
  'use strict';

  angular
    .module('dailyreports')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    // Set top bar menu items
    menuService.addMenuItem('topbar', {
      title: 'Daily List',
      state: 'dailyreports',
      roles: ['user', 'associate']
    });
  }
}());
