const mongoose = require('mongoose');

const bookHistorySchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
    },
    action: {
        type: String,
        enum: ['created', 'updated', 'copies_added', 'deleted'],
        required: true,
    },
    changes: [{
        field: { type: String, required: true },
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
    }],
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('BookHistory', bookHistorySchema);
