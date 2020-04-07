'use strict';

/**
 * Module dependencies
 */
var entriesPolicy = require('../policies/entries.server.policy'),
  entries = require('../controllers/entries.server.controller');

module.exports = function(app) {
  // Entries Routes
  app.route('/api/entries').all(entriesPolicy.isAllowed)
    .get(entries.list)
    .post(entries.create);

  app.route('/api/entries/:entryId').all(entriesPolicy.isAllowed)
    .get(entries.read)
    .put(entries.update)
    .delete(entries.delete);

  app.route('/api/entries/:child/:type/:entryId?').all(entriesPolicy.isAllowed)
    .get(entries.getLastEntry);

  app.route('/api/awakePairEntry/:entryId').all(entriesPolicy.isAllowed)
    .get(entries.getAwakePairEntry)
    .put(entries.update)
    .delete(entries.delete);
  // Finish by binding the Entry middleware
  app.param('entryId', entries.entryByID);
};
