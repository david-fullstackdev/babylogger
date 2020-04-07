'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Babysetting Schema
 */
var BabysettingSchema = new Schema({
  name: {
    type: String,
    default: '',
    required: 'Please fill Babysetting name',
    trim: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

mongoose.model('Babysetting', BabysettingSchema);
