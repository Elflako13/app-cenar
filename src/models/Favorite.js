const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  client:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  commerce: { type: mongoose.Schema.Types.ObjectId, ref: 'Commerce', required: true },
}, { timestamps: true });

favoriteSchema.index({ client: 1, commerce: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
