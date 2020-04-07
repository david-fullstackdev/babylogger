'use strict';

/**
 * Module dependencies.
 */
require('moment-duration-format');
var path = require('path'),
  moment = require('moment'),
  mongoose = require('mongoose'),
  Entry = mongoose.model('Entry'),
  Child = mongoose.model('Child'),
  EntryDetail = mongoose.model('EntryDetail'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  async = require('async'),
  _ = require('lodash');

/**
 * List of Dailyreports
 */
exports.list = function(req, res) {
  var child = req.child;
  var startDate = new Date(req.params.startDate);
  var endDate = new Date(req.params.endDate);
  var entryDetailsList = [];
  Entry.find({ $and: [{ child: child }, { $and: [{ date: { $gte: startDate } }, { date: { $lte: endDate } }] }] }).sort({ date: 1, created: 1 }).exec(function(err, dailyreports) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      _.each(dailyreports, function(report) {
        if (report.type === 'awake') {
          entryDetailsList.push(function(cb) {
            EntryDetail.findOne({ awakeEntry: report._id }).sort('-_id').populate('asleepEntry').exec(function (err, detail) {
              cb(err, detail);
            });
          });
        }
      });
      async.parallel(entryDetailsList, function(err, results) {
        var returnData = [];
        _.each(dailyreports, function(data) {
          data = data.toObject();
          var item = results.find(function(d) { return d && d.awakeEntry.toString() === data._id.toString(); });
          if (item) {
            data.date.setSeconds(1);
            var ms = moment(data.date, 'DD/MM/YYYY HH:mm:ss').diff(moment(item.asleepEntry.date, 'DD/MM/YYYY HH:mm:ss'));
            var d = moment.duration(ms);
            data.duration = d.format('d [days] h [hr] m [min]');
            data.asleepEntryId = item.asleepEntry._id;
          }
          returnData.push(data);
        });
        res.jsonp(returnData);
      });
    }
  });
};
