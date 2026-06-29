const Book = require('../models/Book');

// GET /api/books?search=harry&category=64abc...
const getBooks = async (req, res) => {
    try {
        const { search, category } = req.query;

        // בונים את אובייקט הסינון לפי מה שנשלח ב-query
        const filter = {};

        if (search) {
            // חיפוש טקסט בשם הספר או שם המחבר (לא תלוי רישיות)
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } },
            ];
        }

        if (category) {
            filter.category = category;
        }

        const books = await Book.find(filter).populate('category', 'name');
        res.json(books);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/books/:id
const getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate('category', 'name');
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json(book);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/books  (admin only)
const createBook = async (req, res) => {
    try {
        const { title, author, category, description, publishedYear, coverImage, totalCopies } = req.body;

        const book = await Book.create({
            title,
            author,
            category,
            description,
            publishedYear,
            coverImage,
            totalCopies: totalCopies || 1,
            availableCopies: totalCopies || 1,
        });

        res.status(201).json(book);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// PATCH /api/books/:id  (admin only)
const updateBook = async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.json(book);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// DELETE /api/books/:id  (admin only)
const deleteBook = async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json({ message: 'Book deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { getBooks, getBookById, createBook, updateBook, deleteBook };
