'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Child Schema
 */
var ChildSchema = new Schema({
  firstName: {
    type: String,
    trim: true,
    default: '',
    required: 'Please fill in first name'
  },
  lastName: {
    type: String,
    trim: true,
    default: '',
    required: 'Please fill in first name'
  },
  imageURL: {
    type: String,
    default: 'modules/users/client/img/profile/default.png'
  },
  birthDay: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    default: ''
  },
  dayBeginsAt: {
    type: String,
    default: ''
  },
  nightBeginsAt: {
    type: String,
    default: ''
  },
  miscellaneous: {
    type: String,
    default: ''
  },
  updated: {
    type: Date
  },
  created: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  bottleContents: []
});

mongoose.model('Child', ChildSchema);
