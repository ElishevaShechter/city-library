const Book = require('../models/Book');
const Category = require('../models/Category');
const Loan = require('../models/Loan');
const BookHistory = require('../models/BookHistory');

const REQUIRED_FIELDS = ['title', 'author', 'isbn', 'publisher', 'publishedYear', 'category', 'totalCopies'];
const EDITABLE_FIELDS = ['title', 'author', 'isbn', 'publisher', 'publishedYear', 'category', 'description', 'coverImage', 'totalCopies'];

const normalizeIsbn = (isbn) => String(isbn).replace(/[-\s]/g, '').toUpperCase();

// בדיקת פורמט בסיסית בלבד (אורך ותווים) - ללא חישוב checksum
const isValidIsbnFormat = (isbn) => {
    const clean = normalizeIsbn(isbn);
    if (clean.length === 10) return /^\d{9}[\dX]$/.test(clean);
    if (clean.length === 13) return /^\d{13}$/.test(clean);
    return false;
};

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
        const { title, author, isbn, publisher, publishedYear, category, description, coverImage, totalCopies } = req.body;

        const missing = REQUIRED_FIELDS.filter((field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');
        if (missing.length > 0) {
            return res.status(400).json({ message: `Missing required field(s): ${missing.join(', ')}` });
        }

        if (!isValidIsbnFormat(isbn)) {
            return res.status(400).json({ message: 'Invalid ISBN format' });
        }

        if (!Number.isInteger(totalCopies) || totalCopies < 1) {
            return res.status(400).json({ message: 'totalCopies must be a positive integer' });
        }

        const categoryDoc = await Category.findById(category);
        if (!categoryDoc) {
            return res.status(400).json({ message: 'Category not found' });
        }

        const cleanIsbn = normalizeIsbn(isbn);
        const existingBook = await Book.findOne({ isbn: cleanIsbn });

        if (existingBook) {
            // ISBN כבר קיים בקטלוג - במקום ליצור רשומה כפולה, מוסיפים עותקים לספר הקיים
            const oldTotal = existingBook.totalCopies;
            existingBook.totalCopies += totalCopies;
            existingBook.availableCopies += totalCopies;
            await existingBook.save();

            await BookHistory.create({
                book: existingBook._id,
                action: 'copies_added',
                changes: [{ field: 'totalCopies', oldValue: oldTotal, newValue: existingBook.totalCopies }],
                performedBy: req.user.id,
            });

            return res.status(200).json(existingBook);
        }

        const book = await Book.create({
            title,
            author,
            isbn: cleanIsbn,
            publisher,
            publishedYear,
            category,
            description,
            coverImage,
            totalCopies,
            availableCopies: totalCopies,
        });

        await BookHistory.create({
            book: book._id,
            action: 'created',
            changes: [],
            performedBy: req.user.id,
        });

        res.status(201).json(book);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// PATCH /api/books/:id  (admin only)
const updateBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        if (req.body.isbn !== undefined) {
            if (!isValidIsbnFormat(req.body.isbn)) {
                return res.status(400).json({ message: 'Invalid ISBN format' });
            }
            const cleanIsbn = normalizeIsbn(req.body.isbn);
            const duplicate = await Book.findOne({ isbn: cleanIsbn, _id: { $ne: book._id } });
            if (duplicate) {
                return res.status(400).json({ message: 'ISBN already belongs to another book' });
            }
            req.body.isbn = cleanIsbn;
        }

        if (req.body.category !== undefined) {
            const categoryDoc = await Category.findById(req.body.category);
            if (!categoryDoc) {
                return res.status(400).json({ message: 'Category not found' });
            }
        }

        // אם משנים את מספר העותקים הכולל, יש לשמר את מספר העותקים המושאלים כרגע
        // (totalCopies הישן פחות availableCopies הישן) ולא לאפשר לרדת מתחתיו
        let newAvailableCopies;
        if (req.body.totalCopies !== undefined) {
            if (!Number.isInteger(req.body.totalCopies) || req.body.totalCopies < 1) {
                return res.status(400).json({ message: 'totalCopies must be a positive integer' });
            }
            const loanedCount = book.totalCopies - book.availableCopies;
            newAvailableCopies = req.body.totalCopies - loanedCount;
            if (newAvailableCopies < 0) {
                return res.status(400).json({ message: 'Cannot reduce total copies below the number currently on loan' });
            }
        }

        const changes = [];
        EDITABLE_FIELDS.forEach((field) => {
            if (req.body[field] === undefined) return;
            const oldValue = field === 'category' ? book.category.toString() : book[field];
            const newValue = req.body[field];
            if (String(oldValue) !== String(newValue)) {
                changes.push({ field, oldValue, newValue });
            }
            book[field] = newValue;
        });

        if (newAvailableCopies !== undefined && book.availableCopies !== newAvailableCopies) {
            changes.push({ field: 'availableCopies', oldValue: book.availableCopies, newValue: newAvailableCopies });
            book.availableCopies = newAvailableCopies;
        }

        await book.save();

        if (changes.length > 0) {
            await BookHistory.create({
                book: book._id,
                action: 'updated',
                changes,
                performedBy: req.user.id,
            });
        }

        res.json(book);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// DELETE /api/books/:id  (admin only)
const deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const activeLoans = await Loan.countDocuments({ book: book._id, status: 'active' });
        if (activeLoans > 0) {
            return res.status(400).json({ message: 'Cannot delete a book with copies currently on loan' });
        }

        await Book.findByIdAndDelete(book._id);

        await BookHistory.create({
            book: book._id,
            action: 'deleted',
            changes: [],
            performedBy: req.user.id,
        });

        res.json({ message: 'Book deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/books/:id/history  (admin only)
const getBookHistory = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const history = await BookHistory.find({ book: book._id })
            .populate('performedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(history);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/books/reset-availability  (admin only)
const resetAvailability = async (req, res) => {
    try {
        const books = await Book.find({});
        await Promise.all(books.map(b =>
            Book.findByIdAndUpdate(b._id, { availableCopies: b.totalCopies })
        ));
        await Loan.updateMany({ status: 'active' }, { status: 'returned', returnDate: new Date() });
        res.json({ message: 'All books reset to full availability' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { getBooks, getBookById, createBook, updateBook, deleteBook, getBookHistory, resetAvailability };
