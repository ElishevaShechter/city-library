const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    memberNumber: {
        type: Number,
        unique: true,
        sparse: true,
    },
    nationalId: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
