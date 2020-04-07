'use strict';

/**
 * Module dependencies
 */
var childsPolicy = require('../policies/childs.server.policy'),
  childs = require('../controllers/childs.server.controller');

module.exports = function(app) {
  // Childs Routes
  app.route('/api/childs').all(childsPolicy.isAllowed)
    .get(childs.list)
    .post(childs.create);

  app.route('/api/childs/:childId').all(childsPolicy.isAllowed)
    .get(childs.read)
    .put(childs.update)
    .delete(childs.delete);

  app.route('/pictures/:filename').get(childs.readImage);

  app.route('/api/upload_photo').post(childs.uploadChildPicture);
  // Finish by binding the Child middleware
  app.param('childId', childs.childByID);
};
