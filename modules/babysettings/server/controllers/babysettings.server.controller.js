'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Babysetting = mongoose.model('Babysetting'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**
 * Create a Babysetting
 */
exports.create = function(req, res) {
  var babysetting = new Babysetting(req.body);
  babysetting.user = req.user;

  babysetting.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(babysetting);
    }
  });
};

/**
 * Show the current Babysetting
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var babysetting = req.babysetting ? req.babysetting.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  babysetting.isCurrentUserOwner = req.user && babysetting.user && babysetting.user._id.toString() === req.user._id.toString();

  res.jsonp(babysetting);
};

/**
 * Update a Babysetting
 */
exports.update = function(req, res) {
  var babysetting = req.babysetting;

  babysetting = _.extend(babysetting, req.body);

  babysetting.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(babysetting);
    }
  });
};

/**
 * Delete an Babysetting
 */
exports.delete = function(req, res) {
  var babysetting = req.babysetting;

  babysetting.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(babysetting);
    }
  });
};

/**
 * List of Babysettings
 */
exports.list = function(req, res) {
  Babysetting.find().sort('-created').populate('user', 'displayName').exec(function(err, babysettings) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(babysettings);
    }
  });
};

/**
 * Babysetting middleware
 */
exports.babysettingByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Babysetting is invalid'
    });
  }

  Babysetting.findById(id).populate('user', 'displayName').exec(function (err, babysetting) {
    if (err) {
      return next(err);
    } else if (!babysetting) {
      return res.status(404).send({
        message: 'No Babysetting with that identifier has been found'
      });
    }
    req.babysetting = babysetting;
    next();
  });
};
