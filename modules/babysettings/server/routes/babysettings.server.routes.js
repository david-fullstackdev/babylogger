'use strict';

/**
 * Module dependencies
 */
var babysettingsPolicy = require('../policies/babysettings.server.policy'),
  babysettings = require('../controllers/babysettings.server.controller');

module.exports = function(app) {
  // Babysettings Routes
  app.route('/api/babysettings').all(babysettingsPolicy.isAllowed)
    .get(babysettings.list)
    .post(babysettings.create);

  app.route('/api/babysettings/:babysettingId').all(babysettingsPolicy.isAllowed)
    .get(babysettings.read)
    .put(babysettings.update)
    .delete(babysettings.delete);

  // Finish by binding the Babysetting middleware
  app.param('babysettingId', babysettings.babysettingByID);
};
