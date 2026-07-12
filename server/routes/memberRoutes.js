const express = require('express');
const router = express.Router();
const { searchMembers, getMemberById, updateMember } = require('../controllers/memberController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Members
 *   description: Library member search and management (librarian only)
 */

/**
 * @swagger
 * /api/members:
 *   get:
 *     summary: Search members by name (partial), member number, or national ID (exact) - admin only
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of matching members (empty array if none found)
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admins only
 */
router.get('/', protect, adminOnly, searchMembers);

/**
 * @swagger
 * /api/members/{id}:
 *   get:
 *     summary: Get full member details incl. computed status, current loans, and loan history - admin only
 *     tags: [Members]
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
 *         description: Member details
 *       404:
 *         description: Member not found
 */
router.get('/:id', protect, adminOnly, getMemberById);

/**
 * @swagger
 * /api/members/{id}:
 *   patch:
 *     summary: Update a member's editable details (name, email, national ID) - admin only
 *     tags: [Members]
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
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               nationalId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated member
 *       400:
 *         description: Validation error
 *       404:
 *         description: Member not found
 */
router.patch('/:id', protect, adminOnly, updateMember);

module.exports = router;
