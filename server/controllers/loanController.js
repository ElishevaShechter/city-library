const Loan = require('../models/Loan');
const Book = require('../models/Book');

// POST /api/loans
const createLoan = async (req, res) => {
    try {
        const { bookId } = req.body;

        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        if (book.availableCopies < 1) {
            return res.status(400).json({ message: 'No available copies' });
        }

        // בודק שהמשתמש לא כבר משאיל את אותו ספר
        const existingLoan = await Loan.findOne({
            user: req.user.id,
            book: bookId,
            status: 'active',
        });
        if (existingLoan) {
            return res.status(400).json({ message: 'You already have this book on loan' });
        }

        // dueDate = 14 יום מהיום
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        const loan = await Loan.create({
            user: req.user.id,
            book: bookId,
            dueDate,
        });

        // מוריד עותק פנוי
        book.availableCopies -= 1;
        await book.save();

        await loan.populate('book', 'title author');
        res.status(201).json(loan);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/loans/my
const getMyLoans = async (req, res) => {
    try {
        const loans = await Loan.find({ user: req.user.id })
            .populate('book', 'title author coverImage')
            .sort({ loanDate: -1 });

        res.json(loans);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/loans  (admin only)
const getAllLoans = async (req, res) => {
    try {
        const loans = await Loan.find()
            .populate('book', 'title author')
            .populate('user', 'name email')
            .sort({ loanDate: -1 });

        res.json(loans);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// PATCH /api/loans/:id/return
const returnLoan = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id);

        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        // מוודא שהמשתמש מחזיר השאלה שלו בלבד (אלא אם admin)
        if (loan.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (loan.status === 'returned') {
            return res.status(400).json({ message: 'Book already returned' });
        }

        loan.status = 'returned';
        loan.returnDate = new Date();
        await loan.save();

        // מעלה עותק פנוי
        await Book.findByIdAndUpdate(loan.book, { $inc: { availableCopies: 1 } });

        res.json(loan);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { createLoan, getMyLoans, getAllLoans, returnLoan };
