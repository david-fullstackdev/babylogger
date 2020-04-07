(function () {
  'use strict';

  angular
    .module('summaries')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    // Set top bar menu items
    menuService.addMenuItem('topbar', {
      title: 'Reports',
      state: 'summaries',
      roles: ['user', 'associate']
    });
  }
}());
