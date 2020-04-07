'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Device = mongoose.model('Device'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  device;

/**
 * Device routes tests
 */
describe('Device CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new Device
    user.save(function () {
      device = {
        name: 'Device name'
      };

      done();
    });
  });

  it('should be able to save a Device if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Device
        agent.post('/api/devices')
          .send(device)
          .expect(200)
          .end(function (deviceSaveErr, deviceSaveRes) {
            // Handle Device save error
            if (deviceSaveErr) {
              return done(deviceSaveErr);
            }

            // Get a list of Devices
            agent.get('/api/devices')
              .end(function (devicesGetErr, devicesGetRes) {
                // Handle Devices save error
                if (devicesGetErr) {
                  return done(devicesGetErr);
                }

                // Get Devices list
                var devices = devicesGetRes.body;

                // Set assertions
                (devices[0].user._id).should.equal(userId);
                (devices[0].name).should.match('Device name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Device if not logged in', function (done) {
    agent.post('/api/devices')
      .send(device)
      .expect(403)
      .end(function (deviceSaveErr, deviceSaveRes) {
        // Call the assertion callback
        done(deviceSaveErr);
      });
  });

  it('should not be able to save an Device if no name is provided', function (done) {
    // Invalidate name field
    device.name = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Device
        agent.post('/api/devices')
          .send(device)
          .expect(400)
          .end(function (deviceSaveErr, deviceSaveRes) {
            // Set message assertion
            (deviceSaveRes.body.message).should.match('Please fill Device name');

            // Handle Device save error
            done(deviceSaveErr);
          });
      });
  });

  it('should be able to update an Device if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Device
        agent.post('/api/devices')
          .send(device)
          .expect(200)
          .end(function (deviceSaveErr, deviceSaveRes) {
            // Handle Device save error
            if (deviceSaveErr) {
              return done(deviceSaveErr);
            }

            // Update Device name
            device.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Device
            agent.put('/api/devices/' + deviceSaveRes.body._id)
              .send(device)
              .expect(200)
              .end(function (deviceUpdateErr, deviceUpdateRes) {
                // Handle Device update error
                if (deviceUpdateErr) {
                  return done(deviceUpdateErr);
                }

                // Set assertions
                (deviceUpdateRes.body._id).should.equal(deviceSaveRes.body._id);
                (deviceUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Devices if not signed in', function (done) {
    // Create new Device model instance
    var deviceObj = new Device(device);

    // Save the device
    deviceObj.save(function () {
      // Request Devices
      request(app).get('/api/devices')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Device if not signed in', function (done) {
    // Create new Device model instance
    var deviceObj = new Device(device);

    // Save the Device
    deviceObj.save(function () {
      request(app).get('/api/devices/' + deviceObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', device.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Device with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/devices/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Device is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Device which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Device
    request(app).get('/api/devices/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Device with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Device if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Device
        agent.post('/api/devices')
          .send(device)
          .expect(200)
          .end(function (deviceSaveErr, deviceSaveRes) {
            // Handle Device save error
            if (deviceSaveErr) {
              return done(deviceSaveErr);
            }

            // Delete an existing Device
            agent.delete('/api/devices/' + deviceSaveRes.body._id)
              .send(device)
              .expect(200)
              .end(function (deviceDeleteErr, deviceDeleteRes) {
                // Handle device error error
                if (deviceDeleteErr) {
                  return done(deviceDeleteErr);
                }

                // Set assertions
                (deviceDeleteRes.body._id).should.equal(deviceSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Device if not signed in', function (done) {
    // Set Device user
    device.user = user;

    // Create new Device model instance
    var deviceObj = new Device(device);

    // Save the Device
    deviceObj.save(function () {
      // Try deleting Device
      request(app).delete('/api/devices/' + deviceObj._id)
        .expect(403)
        .end(function (deviceDeleteErr, deviceDeleteRes) {
          // Set message assertion
          (deviceDeleteRes.body.message).should.match('User is not authorized');

          // Handle Device error error
          done(deviceDeleteErr);
        });

    });
  });

  it('should be able to get a single Device that has an orphaned user reference', function (done) {
    // Create orphan user creds
    var _creds = {
      username: 'orphan',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create orphan user
    var _orphan = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'orphan@test.com',
      username: _creds.username,
      password: _creds.password,
      provider: 'local'
    });

    _orphan.save(function (err, orphan) {
      // Handle save error
      if (err) {
        return done(err);
      }

      agent.post('/api/auth/signin')
        .send(_creds)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var orphanId = orphan._id;

          // Save a new Device
          agent.post('/api/devices')
            .send(device)
            .expect(200)
            .end(function (deviceSaveErr, deviceSaveRes) {
              // Handle Device save error
              if (deviceSaveErr) {
                return done(deviceSaveErr);
              }

              // Set assertions on new Device
              (deviceSaveRes.body.name).should.equal(device.name);
              should.exist(deviceSaveRes.body.user);
              should.equal(deviceSaveRes.body.user._id, orphanId);

              // force the Device to have an orphaned user reference
              orphan.remove(function () {
                // now signin with valid user
                agent.post('/api/auth/signin')
                  .send(credentials)
                  .expect(200)
                  .end(function (err, res) {
                    // Handle signin error
                    if (err) {
                      return done(err);
                    }

                    // Get the Device
                    agent.get('/api/devices/' + deviceSaveRes.body._id)
                      .expect(200)
                      .end(function (deviceInfoErr, deviceInfoRes) {
                        // Handle Device error
                        if (deviceInfoErr) {
                          return done(deviceInfoErr);
                        }

                        // Set assertions
                        (deviceInfoRes.body._id).should.equal(deviceSaveRes.body._id);
                        (deviceInfoRes.body.name).should.equal(device.name);
                        should.equal(deviceInfoRes.body.user, undefined);

                        // Call the assertion callback
                        done();
                      });
                  });
              });
            });
        });
    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Device.remove().exec(done);
    });
  });
});
