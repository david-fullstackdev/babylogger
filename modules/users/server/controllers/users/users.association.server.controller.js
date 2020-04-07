'use strict';

/**
 * Module dependencies
 */
var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  multer = require('multer'),
  config = require(path.resolve('./config/config')),
  User = mongoose.model('User'),
  validator = require('validator'),
  nodemailer = require('nodemailer'),
  async = require('async'),
  crypto = require('crypto');

var smtpTransport = nodemailer.createTransport(config.mailer.options);
var whitelistedFields = ['firstName', 'lastName', 'email', 'username', 'children', 'roles'];

/**
 * Create an Associated user
 */
exports.createAssociatedUser = function(req, res) {
  var user = req.user;
  var associatedUser = new User(req.body);
  associatedUser.creator = req.user;
  associatedUser.provider = 'local';
  associatedUser.password = 'New!user0';
  associatedUser.displayName = associatedUser.firstName + ' ' + associatedUser.lastName;
  if (associatedUser.roles.indexOf('user') > -1) {
    associatedUser.devices = user.devices;
    associatedUser.children = user.children;
  }
  associatedUser.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.render(path.resolve('modules/users/server/templates/new-user-create'), {
        name: associatedUser.displayName,
        appName: config.app.title,
        username: associatedUser.username,
        password: 'New!user0'
      }, function(err, emailHTML) {
        var mailOptions = {
          to: associatedUser.email,
          from: config.mailer.from,
          subject: 'Account creation',
          html: emailHTML
        };

        smtpTransport.sendMail(mailOptions, function(err) {
          if (err) {
            console.log(err);
            return res.status(400).send({
              message: 'Failure sending email'
            });
          }
          delete associatedUser.password;
          delete associatedUser.salt;
          res.jsonp(associatedUser);
        });
      });
    }
  });
};

/**
 * Update Associated user details
 */
exports.updateAssociatedUser = function (req, res) {
  // Init Variables
  var associatedUser = req.associatedUser;
  var user = req.user;

  // Update whitelisted fields only
  associatedUser = _.extend(associatedUser, _.pick(req.body, whitelistedFields));

  associatedUser.updated = Date.now();
  associatedUser.displayName = associatedUser.firstName + ' ' + associatedUser.lastName;
  if (associatedUser.roles.indexOf('user') < 0) {
    associatedUser.devices = [];
  } else {
    associatedUser.devices = user.devices;
    associatedUser.children = user.children;
  }
  associatedUser.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(associatedUser);
    }
  });

};

/**
 * List of Associated users
 */
exports.listAssociatedUser = function(req, res) {
  User.find({ creator: req.user._id }).sort('-created').populate('children').exec(function(err, associatedUsers) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(associatedUsers);
    }
  });
};
/**
 * Show the current Associated user
 */
exports.readAssociatedUser = function(req, res) {
  // convert mongoose document to JSON
  var associatedUser = req.associatedUser ? req.associatedUser.toJSON() : {};
  res.jsonp(associatedUser);
};

/**
 * Delete an Associated user
 */
exports.deleteAssociatedUser = function(req, res) {
  var associatedUser = req.associatedUser;

  associatedUser.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(associatedUser);
    }
  });
};

exports.resetUserPwd = function(req, res, next) {
  var associatedUser = req.associatedUser;
  async.waterfall([
    // Generate random token
    function (done) {
      crypto.randomBytes(20, function (err, buffer) {
        var token = buffer.toString('hex');
        done(err, token);
      });
    },
    // Lookup user by username
    function (token, done) {
      associatedUser.resetPasswordToken = token;
      associatedUser.resetPasswordExpires = Date.now() + 3600000; // 1 hour

      associatedUser.save(function (err) {
        done(err, token, associatedUser);
      });
    },
    function (token, associatedUser, done) {

      var httpTransport = 'http://';
      if (config.secure && config.secure.ssl === true) {
        httpTransport = 'https://';
      }
      var baseUrl = req.app.get('domain') || httpTransport + req.headers.host;
      res.render(path.resolve('modules/users/server/templates/reset-password-email'), {
        name: associatedUser.displayName,
        appName: config.app.title,
        url: baseUrl + '/api/auth/reset/' + token
      }, function (err, emailHTML) {
        done(err, emailHTML, associatedUser);
      });
    },
    // If valid email, send reset email using service
    function (emailHTML, associatedUser, done) {
      var mailOptions = {
        to: associatedUser.email,
        from: config.mailer.from,
        subject: 'Password Reset',
        html: emailHTML
      };

      smtpTransport.sendMail(mailOptions, function (err) {
        if (!err) {
          res.send({
            message: 'Password has been reset. An email has been sent to the provided email with further instructions.'
          });
        } else {
          return res.status(400).send({
            message: 'Failure sending email'
          });
        }

        done(err);
      });
    }
  ], function (err) {
    if (err) {
      return next(err);
    }
  });
};

/**
 * Associated User middleware
 */
exports.associatedUserByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Child is invalid'
    });
  }

  User.findById(id).populate('children').exec(function (err, associatedUser) {
    if (err) {
      return next(err);
    } else if (!associatedUser) {
      return res.status(404).send({
        message: 'No Child with that identifier has been found'
      });
    }
    req.associatedUser = associatedUser;
    next();
  });
};
