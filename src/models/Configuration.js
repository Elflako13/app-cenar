const mongoose = require('mongoose');

const configurationSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true, uppercase: true },
  value: { type: String, required: true },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Configuration', configurationSchema);
