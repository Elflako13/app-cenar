const mongoose = require('mongoose');

const commerceSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name:           { type: String, required: true },
  description:    { type: String },
  phone:          { type: String, required: true },
  logo:           { type: String },
  openingTime:    { type: String, required: true },
  closingTime:    { type: String, required: true },
  commerceType:   { type: mongoose.Schema.Types.ObjectId, ref: 'CommerceType', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Commerce', commerceSchema);
