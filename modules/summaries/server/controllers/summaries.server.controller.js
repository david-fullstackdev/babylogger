'use strict';

/**
 * Module dependencies.
 */
require('moment-duration-format');
var path = require('path'),
  mongoose = require('mongoose'),
  moment = require('moment'),
  Child = mongoose.model('Child'),
  Entry = mongoose.model('Entry'),
  EntryDetail = mongoose.model('EntryDetail'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');


/**
 * Show the current Summary
 */
exports.generateReport = function(req, res) {
  var startDate = new Date(req.query.startDate);
  var endDate = new Date(req.query.endDate);
  var dayNightList = JSON.parse(req.query.dayNight);
  var durationDiff = moment(endDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(startDate, 'DD/MM/YYYY HH:mm:ss'));
  var dateRange = Math.round(moment.duration(durationDiff).format('h') * 1 / 24);
  Entry.find({ $and: [{ child: req.params.childId }, { date: { $gt: startDate } }, { date: { $lt: endDate } }] }).populate('child').sort({ date: 1, created: 1 }).exec(function(err, entries) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var summary = {
      solidfood: {
        day: 0,
        night: 0
      },
      nursing: {
        day: 0,
        night: 0,
        avgLength: ''
      },
      pumping: {
        day: 0,
        night: 0,
        avgLength: '',
        avgQuantity: 0
      },
      bottle: {
        day: 0,
        night: 0,
        avgQuantity: 0
      },
      wet: {
        day: 0,
        night: 0
      },
      dirty: {
        day: 0,
        night: 0
      },
      miscellaneous: {
        day: 0,
        night: 0
      },
      sleep: {
        day: '00:00',
        night: '00:00',
        total: '00:00',
        day_avg: '',
        night_avg: ''
      }
    };
    var sleepDates = [];
    var totalNursingDurationMinutes = 0;
    var totalNursingDurationSeconds = 0;
    var totalPumpingDurationMinutes = 0;
    var totalPumpingDurationSeconds = 0;
    _.each(entries, function(entry, index) {
      var dayBeginAtDate = new Date(dayNightList[entry.date_string].dayBeginDate);
      dayBeginAtDate.setMilliseconds(0);
      var nightBeginAtDate = new Date(dayNightList[entry.date_string].nightBeginDate);
      nightBeginAtDate.setMilliseconds(0);
      if (entry.type !== 'asleep' && entry.type !== 'awake') {
        var entryDate = new Date(entry.date);
        entryDate.setMilliseconds(0);
        if (entryDate >= dayBeginAtDate && entryDate < nightBeginAtDate) {
          summary[entry.type].day ++;
        } else {
          summary[entry.type].night ++;
        }
        if (entry.type == 'nursing') {
          var leftDurationMin = parseInt(entry.leftDuration.split(':')[0]);
          var leftDurationSec = parseInt(entry.leftDuration.split(':')[1]);
          var rightDurationMin = parseInt(entry.rightDuration.split(':')[0]);
          var rightDurationSec = parseInt(entry.rightDuration.split(':')[1]);
          totalNursingDurationMinutes += leftDurationMin + rightDurationMin;
          totalNursingDurationSeconds += leftDurationSec + rightDurationSec;
        }
        if (entry.type == 'pumping') {
          var leftDurationMin = parseInt(entry.leftDuration.split(':')[0]);
          var leftDurationSec = parseInt(entry.leftDuration.split(':')[1]);
          var rightDurationMin = parseInt(entry.rightDuration.split(':')[0]);
          var rightDurationSec = parseInt(entry.rightDuration.split(':')[1]);
          totalPumpingDurationMinutes += leftDurationMin + rightDurationMin;
          totalPumpingDurationSeconds += leftDurationSec + rightDurationSec;
          summary[entry.type].avgQuantity += entry.leftQuantity;
          summary[entry.type].avgQuantity += entry.rightQuantity;
        }
        if (entry.type == 'bottle') {
          summary[entry.type].avgQuantity += entry.quantity;
        }
      } else if (entry.type === 'asleep' && !entry.error) {
        endDate.setSeconds(0);
        endDate.setMilliseconds(0);
        var asleepDate = new Date(entry.date);
        asleepDate.setMilliseconds(0);
        if (endDate.getTime() !== asleepDate.getTime()) {
          sleepDates.push({ asleep: asleepDate, sleepDayBeginAtDate: dayBeginAtDate, sleepNightBeginAtDate: nightBeginAtDate, asleepDateString: entry.date_string });
        }
      } else if (entry.type === 'awake' && !entry.error) {
        var awakeDate = new Date(entry.date);
        awakeDate.setMilliseconds(0);
        if (sleepDates.length > 0) {
          if (awakeDate.getTime() === sleepDates[sleepDates.length - 1].asleep.getTime() && index === entries.length - 1) {
            sleepDates[sleepDates.length - 2].awake = awakeDate;
            sleepDates[sleepDates.length - 2].wakeDayBeginAtDate = dayBeginAtDate;
            sleepDates[sleepDates.length - 2].wakeNightBeginAtDate = nightBeginAtDate;
            sleepDates[sleepDates.length - 2].awakeDateString = entry.date_string;
          } else {
            if (awakeDate.getTime() !== sleepDates[sleepDates.length - 1].asleep.getTime()) {
              sleepDates[sleepDates.length - 1].awake = awakeDate;
              sleepDates[sleepDates.length - 1].wakeDayBeginAtDate = dayBeginAtDate;
              sleepDates[sleepDates.length - 1].wakeNightBeginAtDate = nightBeginAtDate;
              sleepDates[sleepDates.length - 1].awakeDateString = entry.date_string;
            }
          }
        } else {
          sleepDates.push({ awake: awakeDate, wakeDayBeginAtDate: dayBeginAtDate, wakeNightBeginAtDate: nightBeginAtDate, awakeDateString: entry.date_string });
        }
      }
    });
    var sleepHours = 0;
    var sleepDayHours = 0;
    var sleepNightHours = 0;
    var sleepDayMinutes = 0;
    var sleepNightMinutes = 0;
    var dayBeginAtDate = new Date();
    var nightBeginAtDate = new Date();
    if (sleepDates[0] && sleepDates[0].awake && !sleepDates[0].asleep) {
      dayBeginAtDate = new Date(dayNightList[sleepDates[0].awakeDateString].dayBeginDate);
      dayBeginAtDate.setMilliseconds(0);
      nightBeginAtDate = new Date(dayNightList[sleepDates[0].awakeDateString].nightBeginDate);
      nightBeginAtDate.setMilliseconds(0);
      if (sleepDates[0].awake.getTime() !== dayBeginAtDate.getTime()) {
        sleepDates[0].asleep = dayBeginAtDate;
        sleepDates[0].sleepDayBeginAtDate = dayBeginAtDate;
        sleepDates[0].sleepNightBeginAtDate = nightBeginAtDate;
      }
    }
    if (sleepDates[sleepDates.length - 1] && sleepDates[sleepDates.length - 1].asleep && !sleepDates[sleepDates.length - 1].awake) {
      dayBeginAtDate = new Date(dayNightList[sleepDates[sleepDates.length - 1].asleepDateString].dayBeginDate);
      dayBeginAtDate.setMilliseconds(0);
      dayBeginAtDate.setDate(dayBeginAtDate.getDate() + 1);
      nightBeginAtDate = new Date(dayNightList[sleepDates[sleepDates.length - 1].asleepDateString].nightBeginDate);
      nightBeginAtDate.setMilliseconds(0);
      nightBeginAtDate.setDate(nightBeginAtDate.getDate() + 1);
      if (sleepDates[sleepDates.length - 1].asleep.getTime() !== dayBeginAtDate.getTime()) {
        sleepDates[sleepDates.length - 1].awake = dayBeginAtDate;
        sleepDates[sleepDates.length - 1].wakeDayBeginAtDate = dayBeginAtDate;
        sleepDates[sleepDates.length - 1].wakeNightBeginAtDate = nightBeginAtDate;
      }
    }

    _.each(sleepDates, function(item) {
      if (item.asleep && item.awake) {
        var ms = moment(item.awake, 'DD/MM/YYYY HH:mm:ss').diff(moment(item.asleep, 'DD/MM/YYYY HH:mm:ss'));
        var d = moment.duration(ms);
        var days = d.format('d') * 1;
        var hours = d.format('h') * 1;
        var minutes = d.format('m') * 1;
        var restHours = hours;
        var restMinutes = minutes;

        if (days > 0) {
          sleepDayHours += days * 12;
          sleepNightHours += days * 12;
          restHours = restHours - days * 24;
          restMinutes = restMinutes - days * 24 * 60 - restHours * 60;
        } else {
          restMinutes = restMinutes - restHours * 60;
        }
        item.asleep.setDate(item.asleep.getDate() + days);
        item.sleepDayBeginAtDate.setDate(item.sleepDayBeginAtDate.getDate() + days);
        item.sleepNightBeginAtDate.setDate(item.sleepNightBeginAtDate.getDate() + days);

        var tmpAwakeDate = item.awake;
        var tmpAsleepDate = new Date(item.asleep);
        tmpAsleepDate.setDate(item.awake.getDate());
        tmpAsleepDate.setMonth(item.awake.getMonth());
        tmpAsleepDate.setYear(item.awake.getFullYear());

        if (item.sleepDayBeginAtDate <= item.asleep && item.sleepNightBeginAtDate > item.asleep && item.wakeDayBeginAtDate <= item.awake && item.wakeNightBeginAtDate > item.awake && tmpAsleepDate < tmpAwakeDate) {
          sleepDayHours += restHours;
          sleepDayMinutes += restMinutes;
        } else if (item.sleepNightBeginAtDate <= item.asleep && item.wakeDayBeginAtDate.setDate(item.asleep.getDate() + 1) > item.awake) {
          sleepNightHours += restHours;
          sleepNightMinutes += restMinutes;
        } else if (item.sleepDayBeginAtDate > item.asleep && item.wakeDayBeginAtDate >= item.awake) {
          sleepNightHours += restHours;
          sleepNightMinutes += restMinutes;
        } else if (item.sleepDayBeginAtDate <= item.asleep && item.sleepNightBeginAtDate > item.asleep && item.awake >= item.wakeNightBeginAtDate) {
          ms = moment(item.sleepNightBeginAtDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(item.asleep, 'DD/MM/YYYY HH:mm:ss'));
          d = moment.duration(ms);
          hours = d.format('h') * 1;
          sleepDayHours += hours;
          minutes = d.format('m') * 1;
          minutes = minutes - hours * 60;
          sleepDayMinutes += minutes;
          ms = moment(item.awake, 'DD/MM/YYYY HH:mm:ss').diff(moment(item.wakeNightBeginAtDate, 'DD/MM/YYYY HH:mm:ss'));
          d = moment.duration(ms);
          hours = d.format('h') * 1;
          sleepNightHours += hours;
          minutes = d.format('m') * 1;
          minutes = minutes - hours * 60;
          sleepNightMinutes += minutes;
        } else if (item.sleepNightBeginAtDate <= item.asleep && item.wakeDayBeginAtDate <= item.awake && item.wakeNightBeginAtDate > item.awake) {
          item.sleepDayBeginAtDate.setDate(item.sleepDayBeginAtDate.getDate() + 1);
          ms = moment(item.sleepDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(item.asleep, 'DD/MM/YYYY HH:mm:ss'));
          d = moment.duration(ms);
          hours = d.format('h') * 1;
          sleepNightHours += hours;
          minutes = d.format('m') * 1;
          minutes = minutes - hours * 60;
          sleepNightMinutes += minutes;
          ms = moment(item.awake, 'DD/MM/YYYY HH:mm:ss').diff(moment(item.wakeDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss'));
          d = moment.duration(ms);
          hours = d.format('h') * 1;
          sleepDayHours += hours;
          minutes = d.format('m') * 1;
          minutes = minutes - hours * 60;
          sleepDayMinutes += minutes;
        } else if (item.sleepDayBeginAtDate <= item.asleep && item.sleepNightBeginAtDate > item.asleep && item.wakeDayBeginAtDate <= item.awake && item.wakeNightBeginAtDate > item.awake && tmpAsleepDate >= tmpAwakeDate) {
          ms = moment(item.sleepNightBeginAtDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(item.asleep, 'DD/MM/YYYY HH:mm:ss'));
          d = moment.duration(ms);
          hours = d.format('h') * 1;
          sleepDayHours += hours;
          minutes = d.format('m') * 1;
          minutes = minutes - hours * 60;
          sleepDayMinutes += minutes;
          ms = moment(item.sleepNightBeginAtDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(item.sleepDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss'));
          d = moment.duration(ms);
          hours = d.format('h') * 1;
          sleepNightHours += hours;
          minutes = d.format('m') * 1;
          minutes = minutes - hours * 60;
          sleepNightMinutes += minutes;
          ms = moment(item.awake, 'DD/MM/YYYY HH:mm:ss').diff(moment(item.wakeDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss'));
          d = moment.duration(ms);
          hours = d.format('h') * 1;
          sleepDayHours += hours;
          minutes = d.format('m') * 1;
          minutes = minutes - hours * 60;
          sleepDayMinutes += minutes;
        } else if (item.asleep <= item.sleepDayBeginAtDate && item.wakeDayBeginAtDate <= item.awake && item.wakeNightBeginAtDate > item.awake) {
          ms = moment(item.sleepDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(item.asleep, 'DD/MM/YYYY HH:mm:ss'));
          d = moment.duration(ms);
          hours = d.format('h') * 1;
          sleepNightHours += hours;
          minutes = d.format('m') * 1;
          minutes = minutes - hours * 60;
          sleepNightMinutes += minutes;
          ms = moment(item.awake, 'DD/MM/YYYY HH:mm:ss').diff(moment(item.wakeDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss'));
          d = moment.duration(ms);
          hours = d.format('h') * 1;
          sleepDayHours += hours;
          minutes = d.format('m') * 1;
          minutes = minutes - hours * 60;
          sleepDayMinutes += minutes;
        }
        sleepHours += restHours;
      }
    });
    var totalSleepHours = sleepDayHours + sleepNightHours;
    var totalSleepMinutes = sleepDayMinutes + sleepNightMinutes;
    
    sleepDayHours += Math.floor(sleepDayMinutes / 60);
    sleepDayMinutes = sleepDayMinutes % 60;
    sleepNightHours += Math.floor(sleepNightMinutes / 60);
    sleepNightMinutes = sleepNightMinutes % 60;
    totalSleepHours += Math.floor(totalSleepMinutes / 60);
    totalSleepMinutes = totalSleepMinutes % 60;
    var avgDaySleepMinutes = Math.round((sleepDayHours * 60 + sleepDayMinutes) / dateRange);
    var dayAvg = Math.floor(avgDaySleepMinutes/60) + 'h ' + avgDaySleepMinutes % 60 + 'm';
    var avgNightSleepMinutes = Math.round((sleepNightHours * 60 + sleepNightMinutes) / dateRange);
    var nightAvg = Math.floor(avgNightSleepMinutes/60) + 'h ' + avgNightSleepMinutes % 60 + 'm';

    var avgTotalSleepMinutes = Math.round((totalSleepHours * 60 + totalSleepMinutes) / dateRange);

    var totalAvg = Math.floor(avgTotalSleepMinutes/60) + 'h ' + avgTotalSleepMinutes % 60 + 'm';

    summary.sleep.day = sleepDayHours + "h " + sleepDayMinutes + "m";
    summary.sleep.night = sleepNightHours + "h " + sleepNightMinutes + "m";
    summary.sleep.total = totalSleepHours + "h " + totalSleepMinutes + "m";
    summary.sleep.day_avg = dayAvg;
    summary.sleep.night_avg = nightAvg;
    summary.sleep.total_avg = totalAvg;

    summary.solidfood.day = Math.round(summary.solidfood.day / dateRange);
    summary.solidfood.night = Math.round(summary.solidfood.night / dateRange);

    summary.nursing.day = Math.round(summary.nursing.day / dateRange);
    summary.nursing.night = Math.round(summary.nursing.night / dateRange);
    var avgNursingSeconds = Math.round((totalNursingDurationMinutes * 60 + totalNursingDurationSeconds) / dateRange);
    summary.nursing.avgLength = Math.floor(avgNursingSeconds / 60) + 'm ' + avgNursingSeconds % 60 + 's';

    summary.pumping.day = Math.round(summary.pumping.day / dateRange);
    summary.pumping.night = Math.round(summary.pumping.night / dateRange);
    var avgPumpingSeconds = Math.round((totalPumpingDurationMinutes * 60 + totalPumpingDurationSeconds) / dateRange);
    summary.pumping.avgLength = Math.floor(avgPumpingSeconds / 60) + 'm ' + avgPumpingSeconds % 60 + 's';
    summary.pumping.avgQuantity = Math.round((summary.pumping.avgQuantity / dateRange) * 10) / 10;

    summary.bottle.day = Math.round(summary.bottle.day / dateRange);
    summary.bottle.night = Math.round(summary.bottle.night / dateRange);
    summary.bottle.avgQuantity = Math.round((summary.bottle.avgQuantity / dateRange) * 10) / 10;

    summary.wet.day = Math.round(summary.wet.day / dateRange);
    summary.wet.night = Math.round(summary.wet.night / dateRange);
    summary.dirty.day = Math.round(summary.dirty.day / dateRange);
    summary.dirty.night = Math.round(summary.dirty.night / dateRange);

    summary.miscellaneous.day = Math.round(summary.miscellaneous.day / dateRange);
    summary.miscellaneous.night = Math.round(summary.miscellaneous.night / dateRange);

    res.jsonp([summary]);
  });
};

exports.generateReportDetail = function(req, res) {
  var events = [req.query.event1];
  if (events.indexOf(req.query.event2) < 0) {
    events.push(req.query.event2);
  }
  if (events.indexOf('asleep') > -1) {
    events.push('awake');
  }
  var startDate = new Date(req.query.startDate);
  var endDate = new Date(req.query.endDate);
  var dayNightList = JSON.parse(req.query.dayNight);

  var durationDiff = moment(endDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(startDate, 'DD/MM/YYYY HH:mm:ss'));
  var dateRange = Math.round(moment.duration(durationDiff).format('h') * 1 / 24);

  Entry.find({ $and: [{ child: req.params.childId }, { date: { $gt: startDate } }, { date: { $lt: endDate } }] }).populate('child').sort({ date: 1, created: 1 }).exec(function(err, entries) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var bottleContents = ['All'];
    if (entries.length > 0 && entries[0].child.bottleContents && entries[0].child.bottleContents.length > 0) {
      _.each(entries[0].child.bottleContents, function(item) {
        if (item) {
          bottleContents.push(item);
        }
      });
    }
    var nursing_details = _.filter(entries, function(item) {
      if (item.type=='nursing') return item;
    }).map(function(item) {
      var leftDuration = item.leftDuration.match(/(\d+)\:(\d+)/);
      var leftMin = parseInt(leftDuration[1]);
      var leftSec = parseInt(leftDuration[2]);
      var rightDuration = item.rightDuration.match(/(\d+)\:(\d+)/);
      var rightMin = parseInt(rightDuration[1]);
      var rightSec = parseInt(rightDuration[2]);
      var totalMin = leftMin + rightMin;
      var totalSec = totalMin * 60 + (leftSec + rightSec);
      totalMin = Math.floor(totalSec / 60);
      totalSec = totalSec % 60;
      if (totalMin < 10) {
        totalMin = '0' + totalMin;
      }
      if (totalSec < 10) {
        totalSec = '0' + totalSec;
      }
      return {date: item.date_string, time: item.time, note: item.note, duration: totalMin + ':'+totalSec, volume: '', contents: ''}
    });
    var pumping_details = _.filter(entries, function(item) {
      if (item.type=='pumping') return item;
    }).map(function(item) {
      var leftDuration = item.leftDuration.match(/(\d+)\:(\d+)/);
      var leftMin = parseInt(leftDuration[1]);
      var leftSec = parseInt(leftDuration[2]);
      var rightDuration = item.rightDuration.match(/(\d+)\:(\d+)/);
      var rightMin = parseInt(rightDuration[1]);
      var rightSec = parseInt(rightDuration[2]);
      var totalMin = leftMin + rightMin;
      var totalSec = totalMin * 60 + (leftSec + rightSec);
      totalMin = Math.floor(totalSec / 60);
      totalSec = totalSec % 60;
      if (totalMin < 10) {
        totalMin = '0' + totalMin;
      }
      if (totalSec < 10) {
        totalSec = '0' + totalSec;
      }
      var volume = item.leftQuantity + item.rightQuantity;
      return {date: item.date_string, time: item.time, note: item.note, duration: totalMin + ':'+totalSec, volume: volume, contents: ''}
    });
    var solidfood_details = _.filter(entries, function(item) {
      if (item.type=='solidfood') return item;
    }).map(function(item) {
      return {date: item.date_string, time: item.time, note: item.note, duration: '', volume: '', contents: ''}
    });
    var wet_details = _.filter(entries, function(item) {
      if (item.type=='wet') return item;
    }).map(function(item) {
      return {date: item.date_string, time: item.time, note: item.note, duration: '', volume: '', contents: ''}
    });
    var dirty_details = _.filter(entries, function(item) {
      if (item.type=='dirty') return item;
    }).map(function(item) {
      return {date: item.date_string, time: item.time, note: item.note, duration: '', volume: '', contents: ''}
    });
    var bottle_details = _.filter(entries, function(item) {
      if (item.type=='bottle') return item;
    }).map(function(item) {
      return {date: item.date_string, time: item.time, contents: item.contents, volume: item.quantity, note: item.note, duration: ''}
    });
    var miscellaneous_details = _.filter(entries, function(item) {
      if (item.type=='miscellaneous') return item;
    }).map(function(item) {
      return {date: item.date_string, time: item.time, contents: item.miscellaneousLabel, note: item.note, volume: '', duration: ''}
    });
    var sleep_details = _.filter(entries, function(item) {
      if (item.type=='asleep' || item.type == 'awake') return item;
    }).map(function(item) {
      return {date: item.date_string, time: item.time, type: item.type, note: item.note}
    });
    var data = {
      details: {
        nursing: nursing_details,
        pumping: pumping_details,
        solidfood: solidfood_details,
        wet: wet_details,
        dirty: dirty_details,
        bottle: bottle_details,
        miscellaneous: miscellaneous_details,
        sleep: sleep_details
      },
      summary: {
        nursing: [],
        pumping: [],
        solidfood: [],
        wet: [],
        dirty: [],
        bottle: {},
        miscellaneous: [],
        sleep: []
      },
      avg: {
        nursing: {
          day: 0,
          night: 0,
          duration: {
            total: "",
            left: "",
            right: ""
          }
        },
        pumping: {
          day: 0,
          night: 0,
          duration: {
            total: "",
            left: "",
            right: ""
          },
          volume: {
            total: 0,
            left: 0,
            right: 0
          }
        },
        solidfood: {
          day: 0,
          night: 0
        },
        wet: {
          day: 0,
          night: 0
        },
        dirty: {
          day: 0,
          night: 0
        },
        miscellaneous: {
          day: 0,
          night: 0
        },
        sleep: {
          day: 0,
          night: 0
        },
        bottle: {}
      }
    };

    _.each(bottleContents, function(item) {
      data.summary.bottle[item] = [];
      data.avg.bottle[item] = {
        day: 0,
        night: 0,
        ounce_day: 0,
        ounce_night: 0
      };
    });
    for (var i = 0; i < dateRange; i++) {
      var tmpDate = new Date(startDate);
      tmpDate.setDate(tmpDate.getDate() + i);
      tmpDate.setHours(16);
      tmpDate.setMinutes(0);
      tmpDate.setSeconds(0);
      tmpDate.setMilliseconds(0);
      data.summary.nursing.push({
        day: 0,
        night: 0,
        logDate: tmpDate
      });
      data.summary.pumping.push({
        day: 0,
        night: 0,
        logDate: tmpDate
      });
      data.summary.solidfood.push({
        day: 0,
        night: 0,
        logDate: tmpDate
      });
      data.summary.wet.push({
        day: 0,
        night: 0,
        logDate: tmpDate
      });
      data.summary.dirty.push({
        day: 0,
        night: 0,
        logDate: tmpDate
      });
      data.summary.miscellaneous.push({
        day: 0,
        night: 0,
        logDate: tmpDate
      });
      data.summary.sleep.push({
        day: 0,
        night: 0,
        logDate: tmpDate
      });

      _.each(bottleContents, function(item) {
        data.summary.bottle[item].push({
          day: 0,
          night: 0,
          ounce_day: 0,
          ounce_night: 0,
          logDate: tmpDate
        });
      });
    }

    var sleepDates = [];
    var totalNursingLeftDurationMin = 0;
    var totalNursingLeftDurationSec = 0;
    var totalNursingRightDurationMin = 0;
    var totalNursingRightDurationSec = 0;
    var totalPumpingLeftDurationMin = 0;
    var totalPumpingLeftDurationSec = 0;
    var totalPumpingRightDurationMin = 0;
    var totalPumpingRightDurationSec = 0;
    var totalPumpingLeftVolume = 0;
    var totalPumpingRightVolume = 0;
    _.each(entries, function(entry) {
      var dayBeginAtDate = new Date(dayNightList[entry.date_string].dayBeginDate);
      dayBeginAtDate.setMilliseconds(0);
      var nightBeginAtDate = new Date(dayNightList[entry.date_string].nightBeginDate);
      nightBeginAtDate.setMilliseconds(0);
      var tmpDate = new Date(entry.date_string.split('-')[0], parseInt(entry.date_string.split('-')[1], 10) - 1, entry.date_string.split('-')[2]);
      if (entry.date < dayBeginAtDate) {
        tmpDate.setDate(tmpDate.getDate() - 1);
      }
      tmpDate.setHours(16);
      tmpDate.setMinutes(0);
      tmpDate.setSeconds(0);
      tmpDate.setMilliseconds(0);
      if (entry.type === 'asleep' && !entry.error) {
        var asleepDate = new Date(entry.date);
        asleepDate.setMilliseconds(0);
        sleepDates.push({ asleep: asleepDate, sleepDayBeginAtDate: dayBeginAtDate, sleepNightBeginAtDate: nightBeginAtDate, asleepDateString: entry.date_string, asleepTime: entry.time, note: entry.note });
      } else if (entry.type === 'awake' && !entry.error) {
        var awakeDate = new Date(entry.date);
        awakeDate.setMilliseconds(0);
        if (sleepDates.length > 0) {
          sleepDates[sleepDates.length - 1].awake = awakeDate;
          sleepDates[sleepDates.length - 1].wakeDayBeginAtDate = dayBeginAtDate;
          sleepDates[sleepDates.length - 1].wakeNightBeginAtDate = nightBeginAtDate;
          sleepDates[sleepDates.length - 1].awakeDateString = entry.date_string;
          sleepDates[sleepDates.length - 1].awakeTime = entry.time;
          sleepDates[sleepDates.length - 1].note = entry.note;
        } else {
          sleepDates.push({ awake: awakeDate, wakeDayBeginAtDate: dayBeginAtDate, wakeNightBeginAtDate: nightBeginAtDate, awakeDateString: entry.date_string, awakeTime: entry.time, note: entry.note });
        }
      }

      for (var i = 0; i < dateRange; i++) {
        var entryTime = entry.time.match(/(\d+)\:(\d+) (\w+)/);
        var entryHour = entryTime[1];
        var entryMinute = entryTime[2];
        var entryAPM = entryTime[3];
        var entryDate = new Date(entry.date);
        if (entry.type !== 'asleep' && entry.type !== 'awake' && entry.type !== 'bottle' && tmpDate.getTime() === data.summary[entry.type][i].logDate.getTime()) {
          var hourLabel = entryHour * 1 + ' ' + entryAPM.toLowerCase();
          if (entry.type === 'nursing') {
            var leftDurationMin = parseInt(entry.leftDuration.split(':')[0]);
            var leftDurationSec = parseInt(entry.leftDuration.split(':')[1]);
            var rightDurationMin = parseInt(entry.rightDuration.split(':')[0]);
            var rightDurationSec = parseInt(entry.rightDuration.split(':')[1]);
            totalNursingLeftDurationMin += leftDurationMin;
            totalNursingLeftDurationSec += leftDurationSec;
            totalNursingRightDurationMin += rightDurationMin;
            totalNursingRightDurationSec += rightDurationSec;
            if (entryDate >= dayBeginAtDate && entryDate < nightBeginAtDate) {
              data.summary.nursing[i].day++;
              data.avg.nursing.day++;
            } else {
              data.summary.nursing[i].night++;
              data.avg.nursing.night++;
            }
          } else if (entry.type === 'pumping') {
            var leftDurationMin = parseInt(entry.leftDuration.split(':')[0]);
            var leftDurationSec = parseInt(entry.leftDuration.split(':')[1]);
            var rightDurationMin = parseInt(entry.rightDuration.split(':')[0]);
            var rightDurationSec = parseInt(entry.rightDuration.split(':')[1]);
            totalPumpingLeftDurationMin += leftDurationMin;
            totalPumpingLeftDurationSec += leftDurationSec;
            totalPumpingRightDurationMin += rightDurationMin;
            totalPumpingRightDurationSec += rightDurationSec;
            totalPumpingLeftVolume += entry.leftQuantity;
            totalPumpingRightVolume += entry.rightQuantity;
            if (entryDate >= dayBeginAtDate && entryDate < nightBeginAtDate) {
              data.summary.pumping[i].day++;
              data.avg.pumping.day++;
            } else {
              data.summary.pumping[i].night++;
              data.avg.pumping.night++;
            }
          } else if (entry.type === 'solidfood' || entry.type === 'wet' || entry.type === 'dirty' || entry.type === 'miscellaneous') {
            if (entryDate >= dayBeginAtDate && entryDate < nightBeginAtDate) {
              data.summary[entry.type][i].day++;
              data.avg[entry.type].day++;
            } else {
              data.summary[entry.type][i].night++;
              data.avg[entry.type].night++;
            }
          }
        } else if (entry.type == 'bottle') {
          _.each(bottleContents, function(item) {
            if (item == entry.contents && tmpDate.getTime() === data.summary[entry.type][item][i].logDate.getTime()) {
              if (entryDate >= dayBeginAtDate && entryDate < nightBeginAtDate) {
                data.summary.bottle[item][i].day++;
                data.avg.bottle['All'].day++;
                data.summary.bottle['All'][i].ounce_day += entry.quantity;
                data.avg.bottle['All'].ounce_day += entry.quantity;
                if (bottleContents.indexOf(entry.contents) > -1) {
                  data.summary.bottle[entry.contents][i].day++;
                  data.avg.bottle[entry.contents].day++;
                  data.summary.bottle[entry.contents][i].ounce_day += entry.quantity;
                  data.avg.bottle[entry.contents].ounce_day += entry.quantity;
                }
              } else {
                data.summary.bottle['All'][i].night++;
                data.avg.bottle['All'].night++;
                data.summary.bottle['All'][i].ounce_night += entry.quantity;
                data.avg.bottle['All'].ounce_night += entry.quantity;
                if (bottleContents.indexOf(entry.contents) > -1) {
                  data.summary.bottle[entry.contents][i].night++;
                  data.avg.bottle[entry.contents].night++;
                  data.summary.bottle[entry.contents][i].ounce_night += entry.quantity;
                  data.avg.bottle[entry.contents].ounce_night += entry.quantity;
                }
              }
            } else if(!entry.contents && tmpDate.getTime() === data.summary[entry.type][item][i].logDate.getTime()) {
              if (entryDate >= dayBeginAtDate && entryDate < nightBeginAtDate) {
                data.summary.bottle[item][i].day++;
                data.avg.bottle['All'].day++;
                data.summary.bottle['All'][i].ounce_day += entry.quantity;
                data.avg.bottle['All'].ounce_day += entry.quantity;
              } else {
                data.summary.bottle['All'][i].night++;
                data.avg.bottle['All'].night++;
                data.summary.bottle['All'][i].ounce_night += entry.quantity;
                data.avg.bottle['All'].ounce_night += entry.quantity;
              }
            }
          });
        }
      }
    });
    if (sleepDates[0] && sleepDates[0].awake && !sleepDates[0].asleep) {
      var dayBeginAtDate = new Date(dayNightList[sleepDates[0].awakeDateString].dayBeginDate);
      dayBeginAtDate.setDate(startDate.getDate());
      dayBeginAtDate.setMonth(startDate.getMonth());
      dayBeginAtDate.setFullYear(startDate.getFullYear());
      dayBeginAtDate.setMilliseconds(0);
      var nightBeginAtDate = new Date(dayNightList[sleepDates[0].awakeDateString].nightBeginDate);
      nightBeginAtDate.setDate(startDate.getDate());
      nightBeginAtDate.setMonth(startDate.getMonth());
      nightBeginAtDate.setFullYear(startDate.getFullYear());
      nightBeginAtDate.setMilliseconds(0);
      if (sleepDates[0].awake.getTime() !== dayBeginAtDate.getTime()) {
        sleepDates[0].asleep = dayBeginAtDate;
        sleepDates[0].asleepDateString = dayBeginAtDate.getFullYear() + "-" + (dayBeginAtDate.getMonth()+1) + "-" + dayBeginAtDate.getDate();
        sleepDates[0].sleepDayBeginAtDate = dayBeginAtDate;
        sleepDates[0].sleepNightBeginAtDate = nightBeginAtDate;
      }
    }
    if (sleepDates[sleepDates.length - 1] && sleepDates[sleepDates.length - 1].asleep && !sleepDates[sleepDates.length - 1].awake) {
      var dayBeginAtDate = new Date(dayNightList[sleepDates[sleepDates.length - 1].asleepDateString].dayBeginDate);
      dayBeginAtDate.setDate(endDate.getDate());
      dayBeginAtDate.setMonth(endDate.getMonth());
      dayBeginAtDate.setFullYear(endDate.getFullYear());
      dayBeginAtDate.setMilliseconds(0);
      var nightBeginAtDate = new Date(dayNightList[sleepDates[sleepDates.length - 1].asleepDateString].nightBeginDate);
      nightBeginAtDate.setDate(endDate.getDate());
      nightBeginAtDate.setMonth(endDate.getMonth());
      nightBeginAtDate.setFullYear(endDate.getFullYear());
      nightBeginAtDate.setMilliseconds(0);
      if (sleepDates[sleepDates.length - 1].asleep.getTime() !== dayBeginAtDate.getTime()) {
        sleepDates[sleepDates.length - 1].awake = dayBeginAtDate;
        sleepDates[sleepDates.length - 1].awakeDateString = dayBeginAtDate.getFullYear() + "-" + (dayBeginAtDate.getMonth()+1) + "-" + dayBeginAtDate.getDate();
        sleepDates[sleepDates.length - 1].wakeDayBeginAtDate = dayBeginAtDate;
        sleepDates[sleepDates.length - 1].wakeNightBeginAtDate = nightBeginAtDate;
      }
    }
    var dateList = [];
    for (i = 0; i < dateRange+1; i++) {
      var tmpDate = new Date(startDate);
      tmpDate.setDate(tmpDate.getDate() + i);
      dateList.push(tmpDate.getFullYear() + '-' + (tmpDate.getMonth() + 1) + '-' + tmpDate.getDate());
    }

    var sleepDetails = [];
    _.each(sleepDates, function(item, index) {
      if (item.asleep && item.awake) {
        var ms = moment(new Date(item.awake), 'DD/MM/YYYY HH:mm:ss').diff(moment(new Date(item.asleep), 'DD/MM/YYYY HH:mm:ss'));
        var d = moment.duration(ms);
        var days = d.format('d') * 1;

        var startDateIndex = dateList.indexOf(item.asleepDateString);
        if (days == 0) {
          if (new Date(dayNightList[dateList[startDateIndex+1]].dayBeginDate) < item.awake) {
            ms = moment(new Date(dayNightList[dateList[startDateIndex+1]].dayBeginDate), 'DD/MM/YYYY HH:mm:ss').diff(moment(item.asleep, 'DD/MM/YYYY HH:mm:ss'));
            d = moment.duration(ms);
            
            sleepDetails.push({
              duration: d.format('m') * 1,
              date: item.asleepDateString,
              time: "",
              index: index,
              asleepDateString: item.asleepDateString,
              awakeDateString: item.awakeDateString,
              asleepTime: item.asleepTime,
              awakeTime: item.awakeTime || "",
              note: item.note || ""
            });
            ms = moment(item.awake, 'DD/MM/YYYY HH:mm:ss').diff(moment(new Date(dayNightList[dateList[startDateIndex+1]].dayBeginDate), 'DD/MM/YYYY HH:mm:ss'));
            d = moment.duration(ms);
            sleepDetails.push({
              duration: d.format('m') * 1,
              date: dateList[startDateIndex+1],
              time: item.awakeTime || "",
              index: index,
              asleepDateString: item.asleepDateString,
              awakeDateString: item.awakeDateString,
              asleepTime: item.asleepTime,
              awakeTime: item.awakeTime || "",
              note: item.note || ""
            });
          } else if (dateList[startDateIndex-1] && new Date(dayNightList[dateList[startDateIndex-1]].nightBeginDate) <= item.asleep && item.asleep <  new Date(dayNightList[dateList[startDateIndex]].dayBeginDate) && new Date(dayNightList[dateList[startDateIndex]].dayBeginDate) < item.awake) {
            ms = moment(new Date(dayNightList[dateList[startDateIndex]].dayBeginDate), 'DD/MM/YYYY HH:mm:ss').diff(moment(item.asleep, 'DD/MM/YYYY HH:mm:ss'));
            d = moment.duration(ms);
            
            sleepDetails.push({
              duration: d.format('m') * 1,
              date: dateList[startDateIndex-1],
              time: "",
              index: index,
              asleepDateString: item.asleepDateString,
              awakeDateString: item.awakeDateString,
              asleepTime: item.asleepTime,
              awakeTime: item.awakeTime || "",
              note: item.note || ""
            });
            ms = moment(item.awake, 'DD/MM/YYYY HH:mm:ss').diff(moment(new Date(dayNightList[dateList[startDateIndex]].dayBeginDate), 'DD/MM/YYYY HH:mm:ss'));
            d = moment.duration(ms);
            sleepDetails.push({
              duration: d.format('m') * 1,
              date: item.awakeDateString,
              time: item.awakeTime || "",
              index: index,
              asleepDateString: item.asleepDateString,
              awakeDateString: item.awakeDateString,
              asleepTime: item.asleepTime,
              awakeTime: item.awakeTime || "",
              note: item.note || ""
            });
          } else {
            ms = moment(item.awake, 'DD/MM/YYYY HH:mm:ss').diff(moment(item.asleep, 'DD/MM/YYYY HH:mm:ss'));
            d = moment.duration(ms);
            sleepDetails.push({
              duration: d.format('m') * 1,
              date: item.asleepDateString,
              time: item.awakeTime || "",
              index: index,
              asleepDateString: item.asleepDateString,
              awakeDateString: item.awakeDateString,
              asleepTime: item.asleepTime,
              awakeTime: item.awakeTime || "",
              note: item.note || ""
            });
          }
        } else {
          var ms = moment(new Date(dayNightList[dateList[startDateIndex+1]].dayBeginDate), 'DD/MM/YYYY HH:mm:ss').diff(moment(new Date(item.asleep), 'DD/MM/YYYY HH:mm:ss'));
          var d = moment.duration(ms);
          sleepDetails.push({
            duration: d.format('m') * 1,
            date: item.asleepDateString,
            time: "",
            index: index,
            asleepDateString: item.asleepDateString,
            awakeDateString: item.awakeDateString,
            asleepTime: item.asleepTime,
            awakeTime: item.awakeTime || "",
              note: item.note || ""
          });
          for (var i = 1; i < days; i++) {
            sleepDetails.push({
              duration: 24 * 60,
              date: dateList[startDateIndex+i],
              time: "",
              index: index,
              asleepDateString: item.asleepDateString,
              awakeDateString: item.awakeDateString,
              asleepTime: item.asleepTime,
              awakeTime: item.awakeTime || "",
              note: item.note || ""
            });
          }
          if (new Date(item.awake) > new Date(item.wakeDayBeginAtDate)) {
            var ms = moment(new Date(item.awake), 'DD/MM/YYYY HH:mm:ss').diff(moment(new Date(item.wakeDayBeginAtDate), 'DD/MM/YYYY HH:mm:ss'));
            var d = moment.duration(ms);
            sleepDetails.push({
              duration: d.format('m') * 1,
              date: item.awakeDateString,
              time: item.awakeTime || "",
              index: index,
              asleepDateString: item.asleepDateString,
              awakeDateString: item.awakeDateString,
              asleepTime: item.asleepTime,
              awakeTime: item.awakeTime || "",
              note: item.note || ""
            });
          }
        }
        
        var dayBeginAtDate = new Date(dayNightList[dateList[startDateIndex]].dayBeginDate);
        dayBeginAtDate.setMilliseconds(0);
        var nightBeginAtDate = new Date(dayNightList[dateList[startDateIndex]].nightBeginDate);
        nightBeginAtDate.setMilliseconds(0);
        if (dayBeginAtDate <= item.asleep && nightBeginAtDate > item.asleep) {
          if (dayBeginAtDate <= item.awake && nightBeginAtDate >= item.awake) {
            ms = moment(item.awake, 'DD/MM/YYYY HH:mm:ss').diff(moment(item.asleep, 'DD/MM/YYYY HH:mm:ss'));
            d = moment.duration(ms);
            data.summary.sleep[startDateIndex].day += d.format('m') * 1;
          } else if(item.awake > nightBeginAtDate) {
            ms = moment(nightBeginAtDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(item.asleep, 'DD/MM/YYYY HH:mm:ss'));
            d = moment.duration(ms);
            data.summary.sleep[startDateIndex].day += d.format('m') * 1;
            var calcFunc = function(val, index) {
              if (startDateIndex+index < dateList.length-1) {
                var nextDayBeginAtDate = new Date(dayNightList[dateList[startDateIndex+index+1]].dayBeginDate);
                nextDayBeginAtDate.setMilliseconds(0);
                var nextNightBeginAtDate = new Date(dayNightList[dateList[startDateIndex+index+1]].nightBeginDate);
                nextNightBeginAtDate.setMilliseconds(0);
              }
              if (item.awake <= nextDayBeginAtDate && startDateIndex+index < dateList.length-1) {
                ms = moment(item.awake, 'DD/MM/YYYY HH:mm:ss').diff(moment(val, 'DD/MM/YYYY HH:mm:ss'));
                d = moment.duration(ms);
                data.summary.sleep[startDateIndex+index].night += d.format('m') * 1;
              } else if(item.awake > nextDayBeginAtDate && item.awake <= nextNightBeginAtDate && startDateIndex+index < dateList.length-1) {
                ms = moment(nextDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(val, 'DD/MM/YYYY HH:mm:ss'));
                d = moment.duration(ms);
                data.summary.sleep[startDateIndex+index].night += d.format('m') * 1;
                ms = moment(item.awake, 'DD/MM/YYYY HH:mm:ss').diff(moment(nextDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss'));
                d = moment.duration(ms);
                data.summary.sleep[startDateIndex+index+1].day += d.format('m') * 1;
              } else if(item.awake > nextNightBeginAtDate  && startDateIndex+index < dateList.length-1) {
                ms = moment(nextDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(val, 'DD/MM/YYYY HH:mm:ss'));
                d = moment.duration(ms);
                data.summary.sleep[startDateIndex+index].night += d.format('m') * 1;
                ms = moment(nextNightBeginAtDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(nextDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss'));
                d = moment.duration(ms);
                data.summary.sleep[startDateIndex+index+1].day += d.format('m') * 1;
                calcFunc(nextNightBeginAtDate, index+1);
              }
            };
            calcFunc(nightBeginAtDate, 0);
          }
        } else if(item.asleep >= nightBeginAtDate) {
          if(item.awake > nightBeginAtDate) {
            var calcFunc = function(val, index) {
              if (startDateIndex+index < dateList.length-1) {
                var nextDayBeginAtDate = new Date(dayNightList[dateList[startDateIndex+index+1]].dayBeginDate);
                nextDayBeginAtDate.setMilliseconds(0);
                var nextNightBeginAtDate = new Date(dayNightList[dateList[startDateIndex+index+1]].nightBeginDate);
                nextNightBeginAtDate.setMilliseconds(0);
              }
              if (item.awake <= nextDayBeginAtDate && startDateIndex+index < dateList.length-1) {
                ms = moment(item.awake, 'DD/MM/YYYY HH:mm:ss').diff(moment(val, 'DD/MM/YYYY HH:mm:ss'));
                d = moment.duration(ms);
                data.summary.sleep[startDateIndex+index].night += d.format('m') * 1;
              } else if(item.awake > nextDayBeginAtDate && item.awake <= nextNightBeginAtDate && startDateIndex+index < dateList.length-1) {
                ms = moment(nextDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(val, 'DD/MM/YYYY HH:mm:ss'));
                d = moment.duration(ms);
                data.summary.sleep[startDateIndex+index].night += d.format('m') * 1;
                ms = moment(item.awake, 'DD/MM/YYYY HH:mm:ss').diff(moment(nextDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss'));
                d = moment.duration(ms);
                data.summary.sleep[startDateIndex+index+1].day += d.format('m') * 1;
              } else if(item.awake > nextNightBeginAtDate  && startDateIndex+index < dateList.length-1) {
                ms = moment(nextDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(val, 'DD/MM/YYYY HH:mm:ss'));
                d = moment.duration(ms);
                data.summary.sleep[startDateIndex+index].night += d.format('m') * 1;
                ms = moment(nextNightBeginAtDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(nextDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss'));
                d = moment.duration(ms);
                data.summary.sleep[startDateIndex+index+1].day += d.format('m') * 1;
                calcFunc(nextNightBeginAtDate, index+1);
              }
            };
            calcFunc(item.asleep, 0);
          }
        } else if(item.asleep < dayBeginAtDate) {
          if (item.awake <= dayBeginAtDate) {
            if (startDateIndex > 0) {
              ms = moment(item.awake, 'DD/MM/YYYY HH:mm:ss').diff(moment(item.asleep, 'DD/MM/YYYY HH:mm:ss'));
              d = moment.duration(ms);
              data.summary.sleep[startDateIndex-1].night += d.format('m') * 1;
            }
          } else {
            if (startDateIndex > 0) {
              ms = moment(dayBeginAtDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(item.asleep, 'DD/MM/YYYY HH:mm:ss'));
              d = moment.duration(ms);
              data.summary.sleep[startDateIndex-1].night += d.format('m') * 1;
            }
            if (dayBeginAtDate < item.awake && nightBeginAtDate >= item.awake) {
              ms = moment(item.awake, 'DD/MM/YYYY HH:mm:ss').diff(moment(dayBeginAtDate, 'DD/MM/YYYY HH:mm:ss'));
              d = moment.duration(ms);
              data.summary.sleep[startDateIndex].day += d.format('m') * 1;
            } else if (item.awake > nightBeginAtDate) {
              ms = moment(nightBeginAtDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(dayBeginAtDate, 'DD/MM/YYYY HH:mm:ss'));
              d = moment.duration(ms);
              data.summary.sleep[startDateIndex].day += d.format('m') * 1;
              var calcFunc = function(val, index) {
                if (startDateIndex+index < dateList.length-1) {
                  var nextDayBeginAtDate = new Date(dayNightList[dateList[startDateIndex+index+1]].dayBeginDate);
                  nextDayBeginAtDate.setMilliseconds(0);
                  var nextNightBeginAtDate = new Date(dayNightList[dateList[startDateIndex+index+1]].nightBeginDate);
                  nextNightBeginAtDate.setMilliseconds(0);
                }
                if (item.awake <= nextDayBeginAtDate && startDateIndex+index < dateList.length-1) {
                  ms = moment(item.awake, 'DD/MM/YYYY HH:mm:ss').diff(moment(val, 'DD/MM/YYYY HH:mm:ss'));
                  d = moment.duration(ms);
                  data.summary.sleep[startDateIndex+index].night += d.format('m') * 1;
                } else if(item.awake > nextDayBeginAtDate && item.awake <= nextNightBeginAtDate && startDateIndex+index < dateList.length-1) {
                  ms = moment(nextDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(val, 'DD/MM/YYYY HH:mm:ss'));
                  d = moment.duration(ms);
                  data.summary.sleep[startDateIndex+index].night += d.format('m') * 1;
                  ms = moment(item.awake, 'DD/MM/YYYY HH:mm:ss').diff(moment(nextDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss'));
                  d = moment.duration(ms);
                  data.summary.sleep[startDateIndex+index+1].day += d.format('m') * 1;
                } else if(item.awake > nextNightBeginAtDate  && startDateIndex+index < dateList.length-1) {
                  ms = moment(nextDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(val, 'DD/MM/YYYY HH:mm:ss'));
                  d = moment.duration(ms);
                  data.summary.sleep[startDateIndex+index].night += d.format('m') * 1;
                  ms = moment(nextNightBeginAtDate, 'DD/MM/YYYY HH:mm:ss').diff(moment(nextDayBeginAtDate, 'DD/MM/YYYY HH:mm:ss'));
                  d = moment.duration(ms);
                  data.summary.sleep[startDateIndex+index+1].day += d.format('m') * 1;
                  calcFunc(nextNightBeginAtDate, index+1);
                }
              };
              calcFunc(nightBeginAtDate, 0);
            }
          }            
        }
      }
    });
    data.details.sleep = sleepDetails;
    //if (events.indexOf('nursing') > -1) {
      var avgNursingLeftSeconds = Math.round((totalNursingLeftDurationMin * 60 + totalNursingLeftDurationSec) / dateRange);
      var avgNursingLeftDuration = Math.floor(avgNursingLeftSeconds / 60) + ':' + avgNursingLeftSeconds % 60;
      var avgNursingRightSeconds = Math.round((totalNursingRightDurationMin * 60 + totalNursingRightDurationSec) / dateRange);
      var avgNursingRightDuration = Math.floor(avgNursingRightSeconds / 60) + ':' + avgNursingRightSeconds % 60;
      var avgNursingTotalSeconds = avgNursingLeftSeconds + avgNursingRightSeconds;
      var avgNursingTotalDuration = Math.floor(avgNursingTotalSeconds / 60) + ':' + avgNursingTotalSeconds % 60;
      data.avg.nursing.day = Math.round(data.avg.nursing.day / dateRange);
      data.avg.nursing.night = Math.round(data.avg.nursing.night / dateRange);
      data.avg.nursing.duration.total = avgNursingTotalDuration;
      data.avg.nursing.duration.left = avgNursingLeftDuration;
      data.avg.nursing.duration.right = avgNursingRightDuration;
    //}
    //if (events.indexOf('pumping') > -1) {
      var avgPumpingLeftSeconds = Math.round((totalPumpingLeftDurationMin * 60 + totalPumpingLeftDurationSec) / dateRange);
      var avgPumpingLeftDuration = Math.floor(avgPumpingLeftSeconds / 60) + ':' + avgPumpingLeftSeconds % 60;
      var avgPumpingRightSeconds = Math.round((totalPumpingRightDurationMin * 60 + totalPumpingRightDurationSec) / dateRange);
      var avgPumpingRightDuration = Math.floor(avgPumpingRightSeconds / 60) + ':' + avgNursingRightSeconds % 60;
      var avgPumpingTotalSeconds = avgPumpingLeftSeconds + avgPumpingRightSeconds;
      var avgPumpingTotalDuration = Math.floor(avgPumpingTotalSeconds / 60) + ':' + avgPumpingTotalSeconds % 60;
      var avgPumpingLeftVolume = Math.round((totalPumpingLeftVolume / dateRange) * 10) / 10;
      var avgPumpingRightVolume = Math.round((totalPumpingRightVolume / dateRange) * 10) / 10;
      var avgPumpingTotalVolume = avgPumpingLeftVolume + avgPumpingRightVolume;
      data.avg.pumping.day = Math.round(data.avg.pumping.day / dateRange);
      data.avg.pumping.night = Math.round(data.avg.pumping.night / dateRange);
      data.avg.pumping.duration.total = avgPumpingTotalDuration;
      data.avg.pumping.duration.left = avgPumpingLeftDuration;
      data.avg.pumping.duration.right = avgPumpingRightDuration;
      data.avg.pumping.volume.total = avgPumpingTotalVolume;
      data.avg.pumping.volume.left = avgPumpingLeftVolume;
      data.avg.pumping.volume.right = avgPumpingRightVolume;
    //}
    //if (events.indexOf('solidfood') > -1) {
      data.avg.solidfood.day = Math.round(data.avg.solidfood.day / dateRange);
      data.avg.solidfood.night = Math.round(data.avg.solidfood.night / dateRange);
    //}
    //if (events.indexOf('wet') > -1) {
      data.avg.wet.day = Math.round(data.avg.wet.day / dateRange);
      data.avg.wet.night = Math.round(data.avg.wet.night / dateRange);
    //}
    //if (events.indexOf('dirty') > -1) {
      data.avg.dirty.day = Math.round(data.avg.dirty.day / dateRange);
      data.avg.dirty.night = Math.round(data.avg.dirty.night / dateRange);
    //}
    //if (events.indexOf('miscellaneous') > -1) {
      data.avg.miscellaneous.day = Math.round(data.avg.miscellaneous.day / dateRange);
      data.avg.miscellaneous.night = Math.round(data.avg.miscellaneous.night / dateRange);
    //}
    //if (events.indexOf('bottle') > -1) {
      _.each(bottleContents, function(item) {
        data.avg.bottle[item].day = Math.round(data.avg.bottle[item].day / dateRange);
        data.avg.bottle[item].night = Math.round(data.avg.bottle[item].night / dateRange);
        data.avg.bottle[item].ounce_day = Math.round(data.avg.bottle[item].ounce_day / dateRange);
        data.avg.bottle[item].ounce_night = Math.round(data.avg.bottle[item].ounce_night / dateRange);
      });
    //}
    //if (events.indexOf('asleep') > -1) {
      var totalDayMins = 0;
      var totalNightMins = 0;
      _.each(data.summary.sleep, function(item) {
        totalDayMins += item.day;
        totalNightMins += item.night;
      });
      data.avg.sleep.day = Math.round(totalDayMins / dateRange);
      data.avg.sleep.night = Math.round(totalNightMins / dateRange);
    //}
    res.jsonp([data]);
  });
};
