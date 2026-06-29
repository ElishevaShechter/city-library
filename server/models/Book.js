const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    author: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    description: {
        type: String,
        trim: true,
    },
    publishedYear: {
        type: Number,
    },
    coverImage: {
        type: String,
    },
    totalCopies: {
        type: Number,
        required: true,
        default: 1,
    },
    availableCopies: {
        type: Number,
        required: true,
        default: 1,
    },
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
