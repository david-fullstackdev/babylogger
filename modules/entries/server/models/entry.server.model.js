'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Entry Schema
 */
var EntrySchema = new Schema({
  type: {
    type: String,
    default: '',
    required: 'Please fill Entry type',
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  date_string: {
    type: String,
    default: ''
  },
  time: {
    type: String,
    default: ''
  },
  note: {
    type: String,
    default: ''
  },
  child: {
    type: Schema.ObjectId,
    ref: 'Child'
  },
  created: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  error: {
    type: Boolean,
    default: false
  },
  leftLast: {
    type: Boolean,
    default: false
  },
  leftDuration: {
    type: String,
    default: ''
  },
  leftQuantity: {
    type: Number,
    default: 0
  },
  rightLast: {
    type: Boolean,
    default: false
  },
  rightDuration: {
    type: String,
    default: ''
  },
  rightQuantity: {
    type: Number,
    default: 0
  },
  quantity: {
    type: Number,
    default: 0
  },
  contents: {
    type: String,
    default: ''
  },
  miscellaneousLabel: {
    type: String,
    default: ''
  }
});

mongoose.model('Entry', EntrySchema);
