const express = require('express');
const router = express.Router();
const { getBooks, getBookById, createBook, updateBook, deleteBook } = require('../controllers/bookController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: Book catalog management
 */

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all books (with optional search and filter)
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or author
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: List of books
 */
router.get('/', getBooks);

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Get a single book by ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book object
 *       404:
 *         description: Book not found
 */
router.get('/:id', getBookById);

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: Add a new book (admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, author, category, totalCopies]
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               publishedYear:
 *                 type: number
 *               coverImage:
 *                 type: string
 *               totalCopies:
 *                 type: number
 *     responses:
 *       201:
 *         description: Book created
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admins only
 */
router.post('/', protect, adminOnly, createBook);

/**
 * @swagger
 * /api/books/{id}:
 *   patch:
 *     summary: Update a book (admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated book
 *       404:
 *         description: Book not found
 */
router.patch('/:id', protect, adminOnly, updateBook);

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: Delete a book (admin only)
 *     tags: [Books]
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
 *         description: Book deleted
 *       404:
 *         description: Book not found
 */
router.delete('/:id', protect, adminOnly, deleteBook);

module.exports = router;
