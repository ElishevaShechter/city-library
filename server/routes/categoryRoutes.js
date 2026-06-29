const express = require('express');
const router = express.Router();
const { getCategories, createCategory } = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Book categories
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', getCategories);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Add a new category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Category already exists
 *       403:
 *         description: Admins only
 */
router.post('/', protect, adminOnly, createCategory);

module.exports = router;
