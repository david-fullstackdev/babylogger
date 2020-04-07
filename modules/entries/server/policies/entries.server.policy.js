'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Entries Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/entries',
      permissions: '*'
    }, {
      resources: '/api/entries/:entryId',
      permissions: '*'
    }, {
      resources: '/api/entries/:child/:type/:entryId?',
      permissions: ['*']
    }, {
      resources: '/api/awakePairEntry/:entryId',
      permissions: ['*']
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/entries',
      permissions: ['*']
    }, {
      resources: '/api/entries/:entryId',
      permissions: ['*']
    }, {
      resources: '/api/entries/:child/:type/:entryId?',
      permissions: ['*']
    }, {
      resources: '/api/awakePairEntry/:entryId',
      permissions: ['*']
    }]
  }, {
    roles: ['associate'],
    allows: [{
      resources: '/api/entries',
      permissions: ['*']
    }, {
      resources: '/api/entries/:entryId',
      permissions: ['*']
    }, {
      resources: '/api/entries/:child/:type/:entryId?',
      permissions: ['*']
    }, {
      resources: '/api/awakePairEntry/:entryId',
      permissions: ['*']
    }]
  }]);
};

/**
 * Check If Entries Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // If an Entry is being processed and the current user created it then allow any manipulation
  if (req.entry && req.user && req.entry.user && req.entry.user.id === req.user.id) {
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
