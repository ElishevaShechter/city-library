const mongoose = require('mongoose');

// אוסף עזר למספור רץ אטומי (MongoDB אין לו auto-increment מובנה)
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
