'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  multer = require('multer'),
  config = require(path.resolve('./config/config')),
  Child = mongoose.model('Child'),
  Device = mongoose.model('Device'),
  User = mongoose.model('User'),
  Entry = mongoose.model('Entry'),
  async = require('async'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  storage = require('multer-gridfs-storage')({ url: config.db.uri }),
  Grid = require('gridfs-stream'),
  _ = require('lodash');

var whitelistedFields = ['children'];
Grid.mongo = mongoose.mongo;
var gfs = new Grid(mongoose.connection.db);
/**
 * Create a Child
 */
exports.create = function (req, res) {
  var child = new Child(req.body);
  child.user = req.user;

  child.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      var usersUpdateCallback = [];
      User.find({ $or: [{ _id: req.user._id }, { _id: req.user.creator }, { $and: [{ creator: req.user._id }, { roles: 'user' }] }] }).exec(function (err, users) {
        _.each(users, function (user) {
          usersUpdateCallback.push(function (cb) {
            var children = user.children;
            children.push(child._id);
            user = _.extend(user, _.pick(children, whitelistedFields));
            user.save(cb(err, { success: true }));
          });
        });
        async.parallel(usersUpdateCallback, function (err, results) {
          res.jsonp(child);
        });
      });
    }
  });
};

/**
 * Show the current Child
 */
exports.read = function (req, res) {
  // convert mongoose document to JSON
  var child = req.child ? req.child.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  child.isCurrentUserOwner = req.user && child.user && child.user._id.toString() === req.user._id.toString();

  res.jsonp(child);
};

/**
 * Update a Child
 */
exports.update = function (req, res) {
  var child = req.child;

  child = _.extend(child, req.body);

  child.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(child);
    }
  });
};

/**
 * Delete an Child
 */
exports.delete = function (req, res) {
  var child = req.child;

  child.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      Device.update({ child: child._id }, { $unset: { child: 1 } }, { multi: true }).exec(function(err, devices) {
        User.update({ children: child._id }, { $pullAll: { children: [child._id] } }, { multi: true }).exec(function(err, users) {
          res.jsonp(child);
        });
      });
    }
  });
};

/**
 * List of Childs
 */
exports.list = function (req, res) {
  Child.find({ _id: { $in: req.user.children } }).sort({ date: -1, created: 1 }).populate('user', 'displayName').exec(function (err, childs) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      var childsEntryCallbacks = [];
      _.each(childs, function(child) {
        childsEntryCallbacks.push(function (cb) {
          Entry.aggregate([
            {
              $match: {
                child: child._id
              }
            },
            {
              $sort: { 'date': -1 }
            },
            {
              $group: {
                _id: '$type',
                created: { '$first': '$created' },
                note: { '$first': '$note' },
                date: { '$first': '$date' },
                time: { '$first': '$time' },
                leftLast: { '$first': '$leftLast' },
                rightLast: { '$first': '$rightLast' },
                leftDuration: { '$first': '$leftDuration' },
                rightDuration: { '$first': '$rightDuration' },
                leftQuantity: { '$first': '$leftQuantity' },
                rightQuantity: { '$first': '$rightQuantity' },
                quantity: { '$first': '$quantity' },
                contents: { '$first': '$contents' },
                miscellaneousLabel: { '$first': '$miscellaneousLabel' },
                child: { '$first': '$child' },
                entryid: { '$first': '$_id' },
                type: { '$first': '$type' },
                error: { '$first': '$error' }
              }
            }
          ], function (err, entries) {
            cb(err, entries);
          });
        });
      });
      async.parallel(childsEntryCallbacks, function (err, results) {
        var new_childs = [];
        _.each(childs, function(child) {
          child = child.toObject();
          child.entries = {};
          _.each(results, function(entry_data) {
            if (entry_data.length > 0 && child._id.toString() === entry_data[0].child.toString()) {
              _.each(entry_data, function(entry) {
                if (entry.type === 'solidfood') {
                  child.entries.solidfood = entry;
                } else if (entry.type === 'wet') {
                  child.entries.wet = entry;
                } else if (entry.type === 'dirty') {
                  child.entries.dirty = entry;
                } else if (entry.type === 'asleep') {
                  child.entries.asleep = entry;
                } else if (entry.type === 'awake') {
                  child.entries.awake = entry;
                } else if (entry.type === 'miscellaneous') {
                  child.entries.miscellaneous = entry;
                } else if (entry.type === 'nursing') {
                  child.entries.nursing = entry;
                } else if (entry.type === 'pumping') {
                  child.entries.pumping = entry;
                } else if (entry.type === 'bottle') {
                  child.entries.bottle = entry;
                }
              });
            }
          });
          new_childs.push(child);
        });
        res.jsonp(new_childs);
      });
    }
  });
};

exports.uploadChildPicture = function (req, res) {
  var user = req.user;
  var upload = multer({ storage: storage }).single('newProfilePicture');
  var profileUploadFileFilter = require(path.resolve('./config/lib/multer')).profileUploadFileFilter;

  // Filtering to upload only images
  upload.fileFilter = profileUploadFileFilter;

  if (user) {
    uploadImage()
      .then(function () {
        res.json({ imgPath: 'pictures/' + req.file.filename });
      })
      .catch(function (err) {
        res.status(422).send(err);
      });
  } else {
    res.status(401).send({
      message: 'User is not signed in'
    });
  }

  function uploadImage() {
    return new Promise(function (resolve, reject) {
      upload(req, res, function (uploadError) {
        if (uploadError) {
          reject(errorHandler.getErrorMessage(uploadError));
        } else {
          resolve();
        }
      });
    });
  }
};

exports.readImage = function (req, res) {
  gfs.files.find({ filename: req.params.filename }).toArray(function (err, files) {

    if (files.length === 0) {
      return res.status(400).send({
        message: 'File not found'
      });
    }
    res.writeHead(200, { 'Content-Type': files[0].contentType });

    var readstream = gfs.createReadStream({
      filename: files[0].filename
    }).pipe(res);
  });
};

/**
 * Child middleware
 */
exports.childByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Child is invalid'
    });
  }

  Child.findById(id).populate('user', 'displayName').exec(function (err, child) {
    if (err) {
      return next(err);
    } else if (!child) {
      return res.status(404).send({
        message: 'No Child with that identifier has been found'
      });
    }
    req.child = child;
    next();
  });
};
