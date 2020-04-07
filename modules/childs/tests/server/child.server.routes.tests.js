'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Child = mongoose.model('Child'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  child;

/**
 * Child routes tests
 */
describe('Child CRUD tests', function () {

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

    // Save a user to the test db and create new Child
    user.save(function () {
      child = {
        name: 'Child name'
      };

      done();
    });
  });

  it('should be able to save a Child if logged in', function (done) {
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

        // Save a new Child
        agent.post('/api/childs')
          .send(child)
          .expect(200)
          .end(function (childSaveErr, childSaveRes) {
            // Handle Child save error
            if (childSaveErr) {
              return done(childSaveErr);
            }

            // Get a list of Childs
            agent.get('/api/childs')
              .end(function (childsGetErr, childsGetRes) {
                // Handle Childs save error
                if (childsGetErr) {
                  return done(childsGetErr);
                }

                // Get Childs list
                var childs = childsGetRes.body;

                // Set assertions
                (childs[0].user._id).should.equal(userId);
                (childs[0].name).should.match('Child name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Child if not logged in', function (done) {
    agent.post('/api/childs')
      .send(child)
      .expect(403)
      .end(function (childSaveErr, childSaveRes) {
        // Call the assertion callback
        done(childSaveErr);
      });
  });

  it('should not be able to save an Child if no name is provided', function (done) {
    // Invalidate name field
    child.name = '';

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

        // Save a new Child
        agent.post('/api/childs')
          .send(child)
          .expect(400)
          .end(function (childSaveErr, childSaveRes) {
            // Set message assertion
            (childSaveRes.body.message).should.match('Please fill Child name');

            // Handle Child save error
            done(childSaveErr);
          });
      });
  });

  it('should be able to update an Child if signed in', function (done) {
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

        // Save a new Child
        agent.post('/api/childs')
          .send(child)
          .expect(200)
          .end(function (childSaveErr, childSaveRes) {
            // Handle Child save error
            if (childSaveErr) {
              return done(childSaveErr);
            }

            // Update Child name
            child.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Child
            agent.put('/api/childs/' + childSaveRes.body._id)
              .send(child)
              .expect(200)
              .end(function (childUpdateErr, childUpdateRes) {
                // Handle Child update error
                if (childUpdateErr) {
                  return done(childUpdateErr);
                }

                // Set assertions
                (childUpdateRes.body._id).should.equal(childSaveRes.body._id);
                (childUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Childs if not signed in', function (done) {
    // Create new Child model instance
    var childObj = new Child(child);

    // Save the child
    childObj.save(function () {
      // Request Childs
      request(app).get('/api/childs')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Child if not signed in', function (done) {
    // Create new Child model instance
    var childObj = new Child(child);

    // Save the Child
    childObj.save(function () {
      request(app).get('/api/childs/' + childObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', child.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Child with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/childs/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Child is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Child which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Child
    request(app).get('/api/childs/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Child with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Child if signed in', function (done) {
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

        // Save a new Child
        agent.post('/api/childs')
          .send(child)
          .expect(200)
          .end(function (childSaveErr, childSaveRes) {
            // Handle Child save error
            if (childSaveErr) {
              return done(childSaveErr);
            }

            // Delete an existing Child
            agent.delete('/api/childs/' + childSaveRes.body._id)
              .send(child)
              .expect(200)
              .end(function (childDeleteErr, childDeleteRes) {
                // Handle child error error
                if (childDeleteErr) {
                  return done(childDeleteErr);
                }

                // Set assertions
                (childDeleteRes.body._id).should.equal(childSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Child if not signed in', function (done) {
    // Set Child user
    child.user = user;

    // Create new Child model instance
    var childObj = new Child(child);

    // Save the Child
    childObj.save(function () {
      // Try deleting Child
      request(app).delete('/api/childs/' + childObj._id)
        .expect(403)
        .end(function (childDeleteErr, childDeleteRes) {
          // Set message assertion
          (childDeleteRes.body.message).should.match('User is not authorized');

          // Handle Child error error
          done(childDeleteErr);
        });

    });
  });

  it('should be able to get a single Child that has an orphaned user reference', function (done) {
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

          // Save a new Child
          agent.post('/api/childs')
            .send(child)
            .expect(200)
            .end(function (childSaveErr, childSaveRes) {
              // Handle Child save error
              if (childSaveErr) {
                return done(childSaveErr);
              }

              // Set assertions on new Child
              (childSaveRes.body.name).should.equal(child.name);
              should.exist(childSaveRes.body.user);
              should.equal(childSaveRes.body.user._id, orphanId);

              // force the Child to have an orphaned user reference
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

                    // Get the Child
                    agent.get('/api/childs/' + childSaveRes.body._id)
                      .expect(200)
                      .end(function (childInfoErr, childInfoRes) {
                        // Handle Child error
                        if (childInfoErr) {
                          return done(childInfoErr);
                        }

                        // Set assertions
                        (childInfoRes.body._id).should.equal(childSaveRes.body._id);
                        (childInfoRes.body.name).should.equal(child.name);
                        should.equal(childInfoRes.body.user, undefined);

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
      Child.remove().exec(done);
    });
  });
});
