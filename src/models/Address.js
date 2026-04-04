const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  label:     { type: String, required: true },
  street:    { type: String, required: true },
  sector:    { type: String, required: true },
  city:      { type: String, required: true },
  reference: { type: String },
  client:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Address', addressSchema);
