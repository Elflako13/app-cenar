const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, enum: ['Admin', 'Client', 'Delivery', 'Commerce'] },
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
