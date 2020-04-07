'use strict';

/**
 * Module dependencies
 */
var acl = require('acl'),
  path = require('path'),
  config = require(path.resolve('./config/config'));

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Devices Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/devices',
      permissions: '*'
    }, {
      resources: '/api/devices/:deviceId',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/devices',
      permissions: '*'
    }, {
      resources: '/api/devices/:deviceId',
      permissions: '*'
    }]
  }]);
};

exports.isAllowedDeviceToken = function (req, res, next) {
  var deviceToken = req.headers.authorization;

  if (!deviceToken || deviceToken != "Basic " + config.deviceToken) {
    return res.jsonp({success: false});
  }
  return next();
};

/**
 * Check If Devices Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // If an Device is being processed and the current user created it then allow any manipulation
  if (req.device && req.user && req.device.user && req.device.user.id === req.user.id) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred
      return res.status(500).send('Unexpected authorization error');
    } else {
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'User is not authorized'
        });
      }
    }
  });
};
