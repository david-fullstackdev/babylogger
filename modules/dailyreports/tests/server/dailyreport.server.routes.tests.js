'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Dailyreport = mongoose.model('Dailyreport'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  dailyreport;

/**
 * Dailyreport routes tests
 */
describe('Dailyreport CRUD tests', function () {

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

    // Save a user to the test db and create new Dailyreport
    user.save(function () {
      dailyreport = {
        name: 'Dailyreport name'
      };

      done();
    });
  });

  it('should be able to save a Dailyreport if logged in', function (done) {
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

        // Save a new Dailyreport
        agent.post('/api/dailyreports')
          .send(dailyreport)
          .expect(200)
          .end(function (dailyreportSaveErr, dailyreportSaveRes) {
            // Handle Dailyreport save error
            if (dailyreportSaveErr) {
              return done(dailyreportSaveErr);
            }

            // Get a list of Dailyreports
            agent.get('/api/dailyreports')
              .end(function (dailyreportsGetErr, dailyreportsGetRes) {
                // Handle Dailyreports save error
                if (dailyreportsGetErr) {
                  return done(dailyreportsGetErr);
                }

                // Get Dailyreports list
                var dailyreports = dailyreportsGetRes.body;

                // Set assertions
                (dailyreports[0].user._id).should.equal(userId);
                (dailyreports[0].name).should.match('Dailyreport name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Dailyreport if not logged in', function (done) {
    agent.post('/api/dailyreports')
      .send(dailyreport)
      .expect(403)
      .end(function (dailyreportSaveErr, dailyreportSaveRes) {
        // Call the assertion callback
        done(dailyreportSaveErr);
      });
  });

  it('should not be able to save an Dailyreport if no name is provided', function (done) {
    // Invalidate name field
    dailyreport.name = '';

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

        // Save a new Dailyreport
        agent.post('/api/dailyreports')
          .send(dailyreport)
          .expect(400)
          .end(function (dailyreportSaveErr, dailyreportSaveRes) {
            // Set message assertion
            (dailyreportSaveRes.body.message).should.match('Please fill Dailyreport name');

            // Handle Dailyreport save error
            done(dailyreportSaveErr);
          });
      });
  });

  it('should be able to update an Dailyreport if signed in', function (done) {
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

        // Save a new Dailyreport
        agent.post('/api/dailyreports')
          .send(dailyreport)
          .expect(200)
          .end(function (dailyreportSaveErr, dailyreportSaveRes) {
            // Handle Dailyreport save error
            if (dailyreportSaveErr) {
              return done(dailyreportSaveErr);
            }

            // Update Dailyreport name
            dailyreport.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Dailyreport
            agent.put('/api/dailyreports/' + dailyreportSaveRes.body._id)
              .send(dailyreport)
              .expect(200)
              .end(function (dailyreportUpdateErr, dailyreportUpdateRes) {
                // Handle Dailyreport update error
                if (dailyreportUpdateErr) {
                  return done(dailyreportUpdateErr);
                }

                // Set assertions
                (dailyreportUpdateRes.body._id).should.equal(dailyreportSaveRes.body._id);
                (dailyreportUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Dailyreports if not signed in', function (done) {
    // Create new Dailyreport model instance
    var dailyreportObj = new Dailyreport(dailyreport);

    // Save the dailyreport
    dailyreportObj.save(function () {
      // Request Dailyreports
      request(app).get('/api/dailyreports')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Dailyreport if not signed in', function (done) {
    // Create new Dailyreport model instance
    var dailyreportObj = new Dailyreport(dailyreport);

    // Save the Dailyreport
    dailyreportObj.save(function () {
      request(app).get('/api/dailyreports/' + dailyreportObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', dailyreport.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Dailyreport with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/dailyreports/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Dailyreport is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Dailyreport which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Dailyreport
    request(app).get('/api/dailyreports/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Dailyreport with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Dailyreport if signed in', function (done) {
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

        // Save a new Dailyreport
        agent.post('/api/dailyreports')
          .send(dailyreport)
          .expect(200)
          .end(function (dailyreportSaveErr, dailyreportSaveRes) {
            // Handle Dailyreport save error
            if (dailyreportSaveErr) {
              return done(dailyreportSaveErr);
            }

            // Delete an existing Dailyreport
            agent.delete('/api/dailyreports/' + dailyreportSaveRes.body._id)
              .send(dailyreport)
              .expect(200)
              .end(function (dailyreportDeleteErr, dailyreportDeleteRes) {
                // Handle dailyreport error error
                if (dailyreportDeleteErr) {
                  return done(dailyreportDeleteErr);
                }

                // Set assertions
                (dailyreportDeleteRes.body._id).should.equal(dailyreportSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Dailyreport if not signed in', function (done) {
    // Set Dailyreport user
    dailyreport.user = user;

    // Create new Dailyreport model instance
    var dailyreportObj = new Dailyreport(dailyreport);

    // Save the Dailyreport
    dailyreportObj.save(function () {
      // Try deleting Dailyreport
      request(app).delete('/api/dailyreports/' + dailyreportObj._id)
        .expect(403)
        .end(function (dailyreportDeleteErr, dailyreportDeleteRes) {
          // Set message assertion
          (dailyreportDeleteRes.body.message).should.match('User is not authorized');

          // Handle Dailyreport error error
          done(dailyreportDeleteErr);
        });

    });
  });

  it('should be able to get a single Dailyreport that has an orphaned user reference', function (done) {
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

          // Save a new Dailyreport
          agent.post('/api/dailyreports')
            .send(dailyreport)
            .expect(200)
            .end(function (dailyreportSaveErr, dailyreportSaveRes) {
              // Handle Dailyreport save error
              if (dailyreportSaveErr) {
                return done(dailyreportSaveErr);
              }

              // Set assertions on new Dailyreport
              (dailyreportSaveRes.body.name).should.equal(dailyreport.name);
              should.exist(dailyreportSaveRes.body.user);
              should.equal(dailyreportSaveRes.body.user._id, orphanId);

              // force the Dailyreport to have an orphaned user reference
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

                    // Get the Dailyreport
                    agent.get('/api/dailyreports/' + dailyreportSaveRes.body._id)
                      .expect(200)
                      .end(function (dailyreportInfoErr, dailyreportInfoRes) {
                        // Handle Dailyreport error
                        if (dailyreportInfoErr) {
                          return done(dailyreportInfoErr);
                        }

                        // Set assertions
                        (dailyreportInfoRes.body._id).should.equal(dailyreportSaveRes.body._id);
                        (dailyreportInfoRes.body.name).should.equal(dailyreport.name);
                        should.equal(dailyreportInfoRes.body.user, undefined);

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
      Dailyreport.remove().exec(done);
    });
  });
});
