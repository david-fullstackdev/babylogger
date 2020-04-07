'use strict';

/**
 * Module dependencies
 */
var dailyReportsPolicy = require('../policies/dailyreports.server.policy'),
  childs = require('../../../childs/server/controllers/childs.server.controller'),
  dailyReports = require('../controllers/dailyreports.server.controller');

module.exports = function(app) {
  // DailyReports Routes
  app.route('/api/dailyreport/:childId/:startDate/:endDate').all(dailyReportsPolicy.isAllowed)
    .get(dailyReports.list);
  app.param('childId', childs.childByID);
};
