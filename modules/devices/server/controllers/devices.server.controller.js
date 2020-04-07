'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  moment = require('moment'),
  mongoose = require('mongoose'),
  Device = mongoose.model('Device'),
  Entry = mongoose.model('Entry'),
  EntryDetail = mongoose.model('EntryDetail'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**
 * Create a Device
 */
exports.create = function(req, res) {
  var device = new Device(req.body);

  device.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(device);
    }
  });
};

/**
 * Show the current Device
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var device = req.device ? req.device.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  device.isCurrentUserOwner = req.user && device.user && device.user._id.toString() === req.user._id.toString();

  res.jsonp(device);
};

exports.createEvent = function(req, res) {
  if (!req.body.device_id || !req.body.event_type || !(req.body.event_type>0 && req.body.event_type<9) ) {
    return res.jsonp({success: false});
  }
  var deviceId = req.body.device_id;
  var eventTypeList = ['bottle', 'solidfood', 'wet', 'dirty', 'sleep', 'nursing', 'pumping', 'miscellaneous'];
  var eventType = eventTypeList[parseInt(req.body.event_type)-1];
  var now = new Date();
  var time = moment(now).format('hh:mm a');
  var date_str = moment(now).format('YYYY-MM-DD');

  Device.findOne({ deviceId: deviceId }).exec(function(err, device) {
    if (err) {
      return res.jsonp({success: false});
    }
    var data = {
      child: device.child,
      user: device.user,
      time: time,
      date_string: date_str,
      type: eventType
    };
    if (eventType == 'sleep') {
      getLastSleepAwakeEvent(device.child, function(entry) {
        if (!entry) {
          data.type = 'asleep';
        } else if (entry.type == 'asleep') {
          data.type = 'awake';
        } else {
          data.type = 'asleep';
        }
        var entry = new Entry(data);
        entry.save(function (err) {
          if (err) {
            return res.jsonp({success: false});
          } else {
            EntryDetail.findOneAndRemove({ $or: [{ asleepEntry: entry._id }, { awakeEntry: entry._id }] }).exec(function (e) {
              addEntryDetailForSleep(entry, function (result) {
                res.jsonp({success: true});
              });
            });
          }
        });
      });
    } else {
      var entry = new Entry(data);
      entry.save(function(err) {
        if (err) {
          return res.jsonp({success: false});
        } else {
          res.jsonp({success: true});
        }
      });
    }
  });
};

function addEntryDetailForSleep(entry, next) {
  var query = { $and: [{child: entry.child}, { date: { $gte: entry.date } }, { created: { $gt: entry.created } }, { type: 'awake' }] };
  if (entry.type === 'awake') {
    query = { $and: [{child: entry.child}, { date: { $lte: entry.date } }, { created: { $lt: entry.created } }, { type: 'asleep' }] };
  }
  var asleepEntry,
    awakeEntry;
  Entry.findOne(query).sort('-date').exec(function(err, item) {
    if (!item) {
      return next({ success: false });
    }
    if (entry.type === 'asleep') {
      asleepEntry = entry;
      awakeEntry = item;
    } else {
      asleepEntry = item;
      awakeEntry = entry;
    }
    var sleepHoursList = [asleepEntry.date];
    var startDate = asleepEntry.date;
    var tmpHours = asleepEntry.date.getHours();
    tmpHours = tmpHours + 1;
    var date = new Date(startDate);
    while (date < awakeEntry.date) {
      date = new Date(startDate);
      date.setHours(tmpHours);
      date.setMinutes(0);
      date.setSeconds(0);
      sleepHoursList.push(date);
      tmpHours++;
    }
    sleepHoursList.pop();
    sleepHoursList.push(awakeEntry.date);
    var entryDetail;
    if (entry.type === 'asleep') {
      entryDetail = new EntryDetail({
        asleepEntry: entry._id,
        awakeEntry: item._id,
        detail: sleepHoursList
      });
    } else {
      entryDetail = new EntryDetail({
        asleepEntry: item._id,
        awakeEntry: entry._id,
        detail: sleepHoursList
      });
    }
    entryDetail.save(function(e) {
      next({ success: true });
    });
  });

}

function getLastSleepAwakeEvent(child, next) {
  var query = { $and: [{child: child}, {$or: [{ type: 'asleep' }, { type: 'awake' }]} ]};
  Entry.findOne(query).sort({ date: -1, created: -1 }).exec(function (err, entry) {
    return next(entry);
  });
}

/**
 * Update a Device
 */
exports.update = function(req, res) {
  var device = req.device;

  device = _.extend(device, req.body);

  device.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(device);
    }
  });
};

/**
 * Delete an Device
 */
exports.delete = function(req, res) {
  var device = req.device;

  device.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(device);
    }
  });
};

/**
 * List of Devices
 */
exports.list = function(req, res) {
  Device.find({ _id: { $in: req.user.devices } }).sort('-created').populate('child').populate('user', 'displayName').exec(function(err, devices) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(devices);
    }
  });
};

/**
 * Device middleware
 */
exports.deviceByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Device is invalid'
    });
  }

  Device.findById(id).populate('user', 'displayName').exec(function (err, device) {
    if (err) {
      return next(err);
    } else if (!device) {
      return res.status(404).send({
        message: 'No Device with that identifier has been found'
      });
    }
    req.device = device;
    next();
  });
};
