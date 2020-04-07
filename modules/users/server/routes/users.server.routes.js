'use strict';

module.exports = function (app) {
  // User Routes
  var adminPolicy = require('../policies/admin.server.policy'),
    users = require('../controllers/users.server.controller');

  // Setting up the users profile api
  app.route('/api/users/me').get(users.me);
  app.route('/api/users').put(users.update);
  app.route('/api/users/accounts').delete(users.removeOAuthProvider);
  app.route('/api/users/password').post(users.changePassword);
  app.route('/api/users/picture').post(users.changeProfilePicture);
  app.route('/api/users/adddevice').post(users.addDevice);

  app.route('/api/users/updateprofile').post(users.updateProfile);

  app.route('/api/associated_users').all(adminPolicy.isAllowed)
    .get(users.listAssociatedUser)
    .post(users.createAssociatedUser);
  app.route('/api/associated_users/:associatedUserId').all(adminPolicy.isAllowed)
    .get(users.readAssociatedUser)
    .delete(users.deleteAssociatedUser)
    .put(users.updateAssociatedUser);
  app.route('/api/associated_user_pwd_reset/:associatedUserId').post(users.resetUserPwd);
  // Finish by binding the user middleware
  app.param('userId', users.userByID);
  app.param('associatedUserId', users.associatedUserByID);
};
