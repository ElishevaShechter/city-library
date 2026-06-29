const Category = require('../models/Category');

// GET /api/categories
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/categories  (admin only)
const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        const existing = await Category.findOne({ name });
        if (existing) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const category = await Category.create({ name });
        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { getCategories, createCategory };
