'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Babysetting = mongoose.model('Babysetting'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  babysetting;

/**
 * Babysetting routes tests
 */
describe('Babysetting CRUD tests', function () {

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

    // Save a user to the test db and create new Babysetting
    user.save(function () {
      babysetting = {
        name: 'Babysetting name'
      };

      done();
    });
  });

  it('should be able to save a Babysetting if logged in', function (done) {
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

        // Save a new Babysetting
        agent.post('/api/babysettings')
          .send(babysetting)
          .expect(200)
          .end(function (babysettingSaveErr, babysettingSaveRes) {
            // Handle Babysetting save error
            if (babysettingSaveErr) {
              return done(babysettingSaveErr);
            }

            // Get a list of Babysettings
            agent.get('/api/babysettings')
              .end(function (babysettingsGetErr, babysettingsGetRes) {
                // Handle Babysettings save error
                if (babysettingsGetErr) {
                  return done(babysettingsGetErr);
                }

                // Get Babysettings list
                var babysettings = babysettingsGetRes.body;

                // Set assertions
                (babysettings[0].user._id).should.equal(userId);
                (babysettings[0].name).should.match('Babysetting name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Babysetting if not logged in', function (done) {
    agent.post('/api/babysettings')
      .send(babysetting)
      .expect(403)
      .end(function (babysettingSaveErr, babysettingSaveRes) {
        // Call the assertion callback
        done(babysettingSaveErr);
      });
  });

  it('should not be able to save an Babysetting if no name is provided', function (done) {
    // Invalidate name field
    babysetting.name = '';

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

        // Save a new Babysetting
        agent.post('/api/babysettings')
          .send(babysetting)
          .expect(400)
          .end(function (babysettingSaveErr, babysettingSaveRes) {
            // Set message assertion
            (babysettingSaveRes.body.message).should.match('Please fill Babysetting name');

            // Handle Babysetting save error
            done(babysettingSaveErr);
          });
      });
  });

  it('should be able to update an Babysetting if signed in', function (done) {
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

        // Save a new Babysetting
        agent.post('/api/babysettings')
          .send(babysetting)
          .expect(200)
          .end(function (babysettingSaveErr, babysettingSaveRes) {
            // Handle Babysetting save error
            if (babysettingSaveErr) {
              return done(babysettingSaveErr);
            }

            // Update Babysetting name
            babysetting.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Babysetting
            agent.put('/api/babysettings/' + babysettingSaveRes.body._id)
              .send(babysetting)
              .expect(200)
              .end(function (babysettingUpdateErr, babysettingUpdateRes) {
                // Handle Babysetting update error
                if (babysettingUpdateErr) {
                  return done(babysettingUpdateErr);
                }

                // Set assertions
                (babysettingUpdateRes.body._id).should.equal(babysettingSaveRes.body._id);
                (babysettingUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Babysettings if not signed in', function (done) {
    // Create new Babysetting model instance
    var babysettingObj = new Babysetting(babysetting);

    // Save the babysetting
    babysettingObj.save(function () {
      // Request Babysettings
      request(app).get('/api/babysettings')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Babysetting if not signed in', function (done) {
    // Create new Babysetting model instance
    var babysettingObj = new Babysetting(babysetting);

    // Save the Babysetting
    babysettingObj.save(function () {
      request(app).get('/api/babysettings/' + babysettingObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', babysetting.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Babysetting with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/babysettings/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Babysetting is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Babysetting which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Babysetting
    request(app).get('/api/babysettings/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Babysetting with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Babysetting if signed in', function (done) {
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

        // Save a new Babysetting
        agent.post('/api/babysettings')
          .send(babysetting)
          .expect(200)
          .end(function (babysettingSaveErr, babysettingSaveRes) {
            // Handle Babysetting save error
            if (babysettingSaveErr) {
              return done(babysettingSaveErr);
            }

            // Delete an existing Babysetting
            agent.delete('/api/babysettings/' + babysettingSaveRes.body._id)
              .send(babysetting)
              .expect(200)
              .end(function (babysettingDeleteErr, babysettingDeleteRes) {
                // Handle babysetting error error
                if (babysettingDeleteErr) {
                  return done(babysettingDeleteErr);
                }

                // Set assertions
                (babysettingDeleteRes.body._id).should.equal(babysettingSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Babysetting if not signed in', function (done) {
    // Set Babysetting user
    babysetting.user = user;

    // Create new Babysetting model instance
    var babysettingObj = new Babysetting(babysetting);

    // Save the Babysetting
    babysettingObj.save(function () {
      // Try deleting Babysetting
      request(app).delete('/api/babysettings/' + babysettingObj._id)
        .expect(403)
        .end(function (babysettingDeleteErr, babysettingDeleteRes) {
          // Set message assertion
          (babysettingDeleteRes.body.message).should.match('User is not authorized');

          // Handle Babysetting error error
          done(babysettingDeleteErr);
        });

    });
  });

  it('should be able to get a single Babysetting that has an orphaned user reference', function (done) {
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

          // Save a new Babysetting
          agent.post('/api/babysettings')
            .send(babysetting)
            .expect(200)
            .end(function (babysettingSaveErr, babysettingSaveRes) {
              // Handle Babysetting save error
              if (babysettingSaveErr) {
                return done(babysettingSaveErr);
              }

              // Set assertions on new Babysetting
              (babysettingSaveRes.body.name).should.equal(babysetting.name);
              should.exist(babysettingSaveRes.body.user);
              should.equal(babysettingSaveRes.body.user._id, orphanId);

              // force the Babysetting to have an orphaned user reference
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

                    // Get the Babysetting
                    agent.get('/api/babysettings/' + babysettingSaveRes.body._id)
                      .expect(200)
                      .end(function (babysettingInfoErr, babysettingInfoRes) {
                        // Handle Babysetting error
                        if (babysettingInfoErr) {
                          return done(babysettingInfoErr);
                        }

                        // Set assertions
                        (babysettingInfoRes.body._id).should.equal(babysettingSaveRes.body._id);
                        (babysettingInfoRes.body.name).should.equal(babysetting.name);
                        should.equal(babysettingInfoRes.body.user, undefined);

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
      Babysetting.remove().exec(done);
    });
  });
});
