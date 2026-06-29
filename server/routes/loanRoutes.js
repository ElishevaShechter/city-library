const express = require('express');
const router = express.Router();
const { createLoan, getMyLoans, getAllLoans, returnLoan } = require('../controllers/loanController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Loans
 *   description: Book borrowing and returning
 */

/**
 * @swagger
 * /api/loans:
 *   post:
 *     summary: Borrow a book
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookId]
 *             properties:
 *               bookId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Loan created, dueDate set to 14 days from now
 *       400:
 *         description: No available copies or already on loan
 *       404:
 *         description: Book not found
 */
router.post('/', protect, createLoan);

/**
 * @swagger
 * /api/loans/my:
 *   get:
 *     summary: Get the logged-in user's loans
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's loans (newest first)
 */
router.get('/my', protect, getMyLoans);

/**
 * @swagger
 * /api/loans:
 *   get:
 *     summary: Get all loans (admin only)
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all loans with user and book details
 *       403:
 *         description: Admins only
 */
router.get('/', protect, adminOnly, getAllLoans);

/**
 * @swagger
 * /api/loans/{id}/return:
 *   patch:
 *     summary: Return a borrowed book
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Loan updated with returnDate and status returned
 *       400:
 *         description: Book already returned
 *       403:
 *         description: Not your loan
 *       404:
 *         description: Loan not found
 */
router.patch('/:id/return', protect, returnLoan);

module.exports = router;
