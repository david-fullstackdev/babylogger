'use strict';

/**
 * Module dependencies
 */
var summariesPolicy = require('../policies/summaries.server.policy'),
  summaries = require('../controllers/summaries.server.controller');

module.exports = function(app) {
  // Summaries Routes
  app.route('/api/summaries/:childId')
    .get(summaries.generateReport);
  app.route('/api/summary_detail/:childId')
    .get(summaries.generateReportDetail);
};
