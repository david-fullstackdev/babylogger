'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Summary = mongoose.model('Summary'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  summary;

/**
 * Summary routes tests
 */
describe('Summary CRUD tests', function () {

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

    // Save a user to the test db and create new Summary
    user.save(function () {
      summary = {
        name: 'Summary name'
      };

      done();
    });
  });

  it('should be able to save a Summary if logged in', function (done) {
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

        // Save a new Summary
        agent.post('/api/summaries')
          .send(summary)
          .expect(200)
          .end(function (summarySaveErr, summarySaveRes) {
            // Handle Summary save error
            if (summarySaveErr) {
              return done(summarySaveErr);
            }

            // Get a list of Summaries
            agent.get('/api/summaries')
              .end(function (summariesGetErr, summariesGetRes) {
                // Handle Summaries save error
                if (summariesGetErr) {
                  return done(summariesGetErr);
                }

                // Get Summaries list
                var summaries = summariesGetRes.body;

                // Set assertions
                (summaries[0].user._id).should.equal(userId);
                (summaries[0].name).should.match('Summary name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Summary if not logged in', function (done) {
    agent.post('/api/summaries')
      .send(summary)
      .expect(403)
      .end(function (summarySaveErr, summarySaveRes) {
        // Call the assertion callback
        done(summarySaveErr);
      });
  });

  it('should not be able to save an Summary if no name is provided', function (done) {
    // Invalidate name field
    summary.name = '';

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

        // Save a new Summary
        agent.post('/api/summaries')
          .send(summary)
          .expect(400)
          .end(function (summarySaveErr, summarySaveRes) {
            // Set message assertion
            (summarySaveRes.body.message).should.match('Please fill Summary name');

            // Handle Summary save error
            done(summarySaveErr);
          });
      });
  });

  it('should be able to update an Summary if signed in', function (done) {
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

        // Save a new Summary
        agent.post('/api/summaries')
          .send(summary)
          .expect(200)
          .end(function (summarySaveErr, summarySaveRes) {
            // Handle Summary save error
            if (summarySaveErr) {
              return done(summarySaveErr);
            }

            // Update Summary name
            summary.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Summary
            agent.put('/api/summaries/' + summarySaveRes.body._id)
              .send(summary)
              .expect(200)
              .end(function (summaryUpdateErr, summaryUpdateRes) {
                // Handle Summary update error
                if (summaryUpdateErr) {
                  return done(summaryUpdateErr);
                }

                // Set assertions
                (summaryUpdateRes.body._id).should.equal(summarySaveRes.body._id);
                (summaryUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Summaries if not signed in', function (done) {
    // Create new Summary model instance
    var summaryObj = new Summary(summary);

    // Save the summary
    summaryObj.save(function () {
      // Request Summaries
      request(app).get('/api/summaries')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Summary if not signed in', function (done) {
    // Create new Summary model instance
    var summaryObj = new Summary(summary);

    // Save the Summary
    summaryObj.save(function () {
      request(app).get('/api/summaries/' + summaryObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', summary.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Summary with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/summaries/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Summary is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Summary which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Summary
    request(app).get('/api/summaries/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Summary with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Summary if signed in', function (done) {
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

        // Save a new Summary
        agent.post('/api/summaries')
          .send(summary)
          .expect(200)
          .end(function (summarySaveErr, summarySaveRes) {
            // Handle Summary save error
            if (summarySaveErr) {
              return done(summarySaveErr);
            }

            // Delete an existing Summary
            agent.delete('/api/summaries/' + summarySaveRes.body._id)
              .send(summary)
              .expect(200)
              .end(function (summaryDeleteErr, summaryDeleteRes) {
                // Handle summary error error
                if (summaryDeleteErr) {
                  return done(summaryDeleteErr);
                }

                // Set assertions
                (summaryDeleteRes.body._id).should.equal(summarySaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Summary if not signed in', function (done) {
    // Set Summary user
    summary.user = user;

    // Create new Summary model instance
    var summaryObj = new Summary(summary);

    // Save the Summary
    summaryObj.save(function () {
      // Try deleting Summary
      request(app).delete('/api/summaries/' + summaryObj._id)
        .expect(403)
        .end(function (summaryDeleteErr, summaryDeleteRes) {
          // Set message assertion
          (summaryDeleteRes.body.message).should.match('User is not authorized');

          // Handle Summary error error
          done(summaryDeleteErr);
        });

    });
  });

  it('should be able to get a single Summary that has an orphaned user reference', function (done) {
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

          // Save a new Summary
          agent.post('/api/summaries')
            .send(summary)
            .expect(200)
            .end(function (summarySaveErr, summarySaveRes) {
              // Handle Summary save error
              if (summarySaveErr) {
                return done(summarySaveErr);
              }

              // Set assertions on new Summary
              (summarySaveRes.body.name).should.equal(summary.name);
              should.exist(summarySaveRes.body.user);
              should.equal(summarySaveRes.body.user._id, orphanId);

              // force the Summary to have an orphaned user reference
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

                    // Get the Summary
                    agent.get('/api/summaries/' + summarySaveRes.body._id)
                      .expect(200)
                      .end(function (summaryInfoErr, summaryInfoRes) {
                        // Handle Summary error
                        if (summaryInfoErr) {
                          return done(summaryInfoErr);
                        }

                        // Set assertions
                        (summaryInfoRes.body._id).should.equal(summarySaveRes.body._id);
                        (summaryInfoRes.body.name).should.equal(summary.name);
                        should.equal(summaryInfoRes.body.user, undefined);

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
      Summary.remove().exec(done);
    });
  });
});
