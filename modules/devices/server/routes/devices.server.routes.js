'use strict';

/**
 * Module dependencies
 */
var devicesPolicy = require('../policies/devices.server.policy'),
  devices = require('../controllers/devices.server.controller');

module.exports = function(app) {
  // Devices Routes
  app.route('/api/devices')
    .get(devices.list)
    .post(devices.create);

  app.route('/api/eventByDevice')
    .all(devicesPolicy.isAllowedDeviceToken)
    .post(devices.createEvent);

  app.route('/api/devices/:deviceId')
    .get(devices.read)
    .put(devices.update)
    .delete(devices.delete);

  // Finish by binding the Device middleware
  app.param('deviceId', devices.deviceByID);
};
