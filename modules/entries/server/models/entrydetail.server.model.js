'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * EntryDetail Schema
 */
var EntryDetailSchema = new Schema({
  asleepEntry: {
    type: Schema.ObjectId,
    ref: 'Entry'
  },
  awakeEntry: {
    type: Schema.ObjectId,
    ref: 'Entry'
  },
  detail: []
});

mongoose.model('EntryDetail', EntryDetailSchema);
