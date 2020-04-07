'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Entry = mongoose.model('Entry'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  entry;

/**
 * Entry routes tests
 */
describe('Entry CRUD tests', function () {

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

    // Save a user to the test db and create new Entry
    user.save(function () {
      entry = {
        name: 'Entry name'
      };

      done();
    });
  });

  it('should be able to save a Entry if logged in', function (done) {
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

        // Save a new Entry
        agent.post('/api/entries')
          .send(entry)
          .expect(200)
          .end(function (entrySaveErr, entrySaveRes) {
            // Handle Entry save error
            if (entrySaveErr) {
              return done(entrySaveErr);
            }

            // Get a list of Entries
            agent.get('/api/entries')
              .end(function (entriesGetErr, entriesGetRes) {
                // Handle Entries save error
                if (entriesGetErr) {
                  return done(entriesGetErr);
                }

                // Get Entries list
                var entries = entriesGetRes.body;

                // Set assertions
                (entries[0].user._id).should.equal(userId);
                (entries[0].name).should.match('Entry name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Entry if not logged in', function (done) {
    agent.post('/api/entries')
      .send(entry)
      .expect(403)
      .end(function (entrySaveErr, entrySaveRes) {
        // Call the assertion callback
        done(entrySaveErr);
      });
  });

  it('should not be able to save an Entry if no name is provided', function (done) {
    // Invalidate name field
    entry.name = '';

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

        // Save a new Entry
        agent.post('/api/entries')
          .send(entry)
          .expect(400)
          .end(function (entrySaveErr, entrySaveRes) {
            // Set message assertion
            (entrySaveRes.body.message).should.match('Please fill Entry name');

            // Handle Entry save error
            done(entrySaveErr);
          });
      });
  });

  it('should be able to update an Entry if signed in', function (done) {
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

        // Save a new Entry
        agent.post('/api/entries')
          .send(entry)
          .expect(200)
          .end(function (entrySaveErr, entrySaveRes) {
            // Handle Entry save error
            if (entrySaveErr) {
              return done(entrySaveErr);
            }

            // Update Entry name
            entry.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Entry
            agent.put('/api/entries/' + entrySaveRes.body._id)
              .send(entry)
              .expect(200)
              .end(function (entryUpdateErr, entryUpdateRes) {
                // Handle Entry update error
                if (entryUpdateErr) {
                  return done(entryUpdateErr);
                }

                // Set assertions
                (entryUpdateRes.body._id).should.equal(entrySaveRes.body._id);
                (entryUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Entries if not signed in', function (done) {
    // Create new Entry model instance
    var entryObj = new Entry(entry);

    // Save the entry
    entryObj.save(function () {
      // Request Entries
      request(app).get('/api/entries')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Entry if not signed in', function (done) {
    // Create new Entry model instance
    var entryObj = new Entry(entry);

    // Save the Entry
    entryObj.save(function () {
      request(app).get('/api/entries/' + entryObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', entry.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Entry with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/entries/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Entry is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Entry which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Entry
    request(app).get('/api/entries/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Entry with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Entry if signed in', function (done) {
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

        // Save a new Entry
        agent.post('/api/entries')
          .send(entry)
          .expect(200)
          .end(function (entrySaveErr, entrySaveRes) {
            // Handle Entry save error
            if (entrySaveErr) {
              return done(entrySaveErr);
            }

            // Delete an existing Entry
            agent.delete('/api/entries/' + entrySaveRes.body._id)
              .send(entry)
              .expect(200)
              .end(function (entryDeleteErr, entryDeleteRes) {
                // Handle entry error error
                if (entryDeleteErr) {
                  return done(entryDeleteErr);
                }

                // Set assertions
                (entryDeleteRes.body._id).should.equal(entrySaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Entry if not signed in', function (done) {
    // Set Entry user
    entry.user = user;

    // Create new Entry model instance
    var entryObj = new Entry(entry);

    // Save the Entry
    entryObj.save(function () {
      // Try deleting Entry
      request(app).delete('/api/entries/' + entryObj._id)
        .expect(403)
        .end(function (entryDeleteErr, entryDeleteRes) {
          // Set message assertion
          (entryDeleteRes.body.message).should.match('User is not authorized');

          // Handle Entry error error
          done(entryDeleteErr);
        });

    });
  });

  it('should be able to get a single Entry that has an orphaned user reference', function (done) {
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

          // Save a new Entry
          agent.post('/api/entries')
            .send(entry)
            .expect(200)
            .end(function (entrySaveErr, entrySaveRes) {
              // Handle Entry save error
              if (entrySaveErr) {
                return done(entrySaveErr);
              }

              // Set assertions on new Entry
              (entrySaveRes.body.name).should.equal(entry.name);
              should.exist(entrySaveRes.body.user);
              should.equal(entrySaveRes.body.user._id, orphanId);

              // force the Entry to have an orphaned user reference
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

                    // Get the Entry
                    agent.get('/api/entries/' + entrySaveRes.body._id)
                      .expect(200)
                      .end(function (entryInfoErr, entryInfoRes) {
                        // Handle Entry error
                        if (entryInfoErr) {
                          return done(entryInfoErr);
                        }

                        // Set assertions
                        (entryInfoRes.body._id).should.equal(entrySaveRes.body._id);
                        (entryInfoRes.body.name).should.equal(entry.name);
                        should.equal(entryInfoRes.body.user, undefined);

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
      Entry.remove().exec(done);
    });
  });
});
