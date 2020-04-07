'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Device Schema
 */
var DeviceSchema = new Schema({
  deviceId: {
    type: String,
    default: '',
    required: 'Please fill Device name',
    trim: true
  },
  deviceNickName: {
    type: String
  },
  child: {
    type: Schema.ObjectId,
    ref: 'Child'
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
  }
});
mongoose.model('Device', DeviceSchema);

/*
var Device = mongoose.model('Device', DeviceSchema);
var device = new Device({
  deviceId: 'XB473621Z'
});
device.save();
*/
