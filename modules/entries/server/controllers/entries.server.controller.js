'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  moment = require('moment'),
  Entry = mongoose.model('Entry'),
  EntryDetail = mongoose.model('EntryDetail'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**
 * Create a Entry
 */
exports.create = function(req, res) {
  var entry = new Entry(req.body);
  entry.user = req.user;

  if (entry.type === 'asleep' || entry.type === 'awake') {
    getLastSleepAwakeEvent(entry, function(data) {
      if (data && data.type === entry.type) entry.error = true;
      entry.save(function(err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          updateRelatedItemStatus(entry, function(result) {
            addEntryDetailForSleep(entry, function(result) {
              res.jsonp(entry);
            });
          });
        }
      });
    });
  } else {
    entry.save(function(err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.jsonp(entry);
      }
    });
  }
};

/**
 * Show the current Entry
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var entry = req.entry ? req.entry.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  // entry.isCurrentUserOwner = req.user && entry.user && entry.user._id.toString() === req.user._id.toString();

  res.jsonp(entry);
};

/**
 * Update a Entry
 */
exports.update = function(req, res) {
  var entry = req.entry;
  entry = _.extend(entry, req.body);
  if (entry.type === 'asleep' || entry.type === 'awake') {
    getLastSleepAwakeEvent(entry, function (data) {
      if (data && data.type === entry.type) entry.error = true;
      else entry.error = false;
      entry.save(function (err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          updateRelatedItemStatus(entry, function (result) {
            EntryDetail.findOneAndRemove({ $or: [{ asleepEntry: entry._id }, { awakeEntry: entry._id }] }).exec(function (e) {
              addEntryDetailForSleep(entry, function (result) {
                res.jsonp(entry);
              });
            });
          });
        }
      });
    });
  } else {
    entry.save(function (err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.jsonp(entry);
      }
    });
  }
};

/**
 * Delete an Entry
 */
exports.delete = function(req, res) {
  var entry = req.entry;

  entry.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(entry);
    }
  });
};

/**
 * List of Entries
 */
exports.list = function(req, res) {
  Entry.find().sort('-date').populate('user', 'displayName').exec(function(err, entries) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(entries);
    }
  });
};

exports.getAwakePairEntry = function(req, res) {
  var entry = req.entry;
  Entry.findOne({child: entry.child._id, type: 'awake', date: { $gte: entry.date }}).sort('date').exec(function(err, awake_entry) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(awake_entry)
    }
  });
};

exports.getLastEntry = function(req, res) {
  var entry = req.entry;
  var query = {child: req.params.child, type: req.params.type};
  if (entry) {
    query = {child: req.params.child, type: req.params.type, _id : {$ne: entry._id}};
  }
  Entry.findOne(query).sort('-date').exec(function(err, entry) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      if (req.params.type == 'asleep' && entry) {
        Entry.findOne({child: req.params.child, type: 'awake', date: { $gte: entry.date }}).sort('-date').exec(function(err, awake_entry) {
          var newEntry = entry.toObject();
          newEntry.awakeEntry = awake_entry;
          res.jsonp(newEntry)
        });
      } else {
        res.jsonp(entry);
      }
    }
  });
};

/**
 * Entry middleware
 */
exports.entryByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Entry is invalid'
    });
  }

  Entry.findById(id).populate('child').exec(function (err, entry) {
    if (err) {
      return next(err);
    } else if (!entry) {
      return res.status(404).send({
        message: 'No Entry with that identifier has been found'
      });
    }
    req.entry = entry;
    next();
  });
};

function getLastSleepAwakeEvent(entry, next) {
  var date = entry.date;
  var type = entry.type;
  var isUpdate = false;
  if (entry._id) isUpdate = true;
  var query = { $and: [{child: entry.child}, { date: { $lte: date } }, { $or: [{ type: 'asleep' }, { type: 'awake' }] }] };
  if (isUpdate) query = { $and: [{child: entry.child}, { _id: { $ne: entry._id } }, { date: { $lte: date } }, { $or: [{ type: 'asleep' }, { type: 'awake' }] }] };
  Entry.find(query).sort({ date: -1, created: -1 }).exec(function (err, entries) {
    if (entries.length === 0 || (type !== 'asleep' && type !== 'awake')) {
      return next(null);
    }
    var data = [];
    _.each(entries, function(entry) {
      var entryDate = entry.date;
      if (date >= entryDate) {
        data.push({
          newDate: entryDate,
          type: entry.type
        });
      }
    });
    return next(data[0]);
  });
}

function updateRelatedItemStatus(entry, next) {
  var date = entry.date;
  var type = entry.type;
  var isUpdate = false;
  if (entry._id) isUpdate = true;
  Entry.findOne({ $and: [{child: entry.child}, { date: { $gte: date } }, { $or: [{ type: 'asleep' }, { type: 'awake' }] }] }).sort({ date: 1, created: 1 }).exec(function (err, entry) {
    if (!entry) {
      return next(null);
    }
    if ((type === 'asleep' && entry.type === 'awake') || (type === 'awake' && entry.type === 'asleep')) {
      entry.error = false;
      entry.save(function(e) {
        return next({ success: true });
      });
    } else {
      return next({ success: true });
    }
  });
}

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
