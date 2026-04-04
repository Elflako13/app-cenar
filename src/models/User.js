const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName:   { type: String },
  lastName:    { type: String },
  userName:    { type: String, required: true, unique: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true },
  phone:       { type: String },
  profileImage:{ type: String },
  role:        { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  isActive:    { type: Boolean, default: false },
  isDefault:   { type: Boolean, default: false },
  // delivery: disponibilidad
  isAvailable: { type: Boolean, default: true },
  // tokens
  activationToken:       { type: String },
  activationTokenExpires:{ type: Date },
  resetToken:            { type: String },
  resetTokenExpires:     { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
