const mongoose = require('mongoose');

const commerceTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('CommerceType', commerceTypeSchema);
