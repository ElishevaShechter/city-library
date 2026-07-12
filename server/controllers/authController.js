const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// יוצר JWT Token עבור משתמש
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// POST /api/auth/signup
const signup = async (req, res) => {
    try {
        const { name, email, password, adminCode } = req.body;

        // בדיקה שהאימייל לא כבר קיים
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // הצפנת הסיסמה
        const hashedPassword = await bcrypt.hash(password, 10);

        // אם נשלח קוד מנהל תקין (מוגדר ב-ENV), החשבון נוצר כ-admin
        const isAdmin = !!process.env.ADMIN_SIGNUP_CODE && adminCode === process.env.ADMIN_SIGNUP_CODE;

        // יצירת המשתמש
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            ...(isAdmin && { role: 'admin' }),
        });

        const token = generateToken(user);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error('[signup]', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // מחפשים את המשתמש לפי אימייל
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // משווים את הסיסמה שנשלחה לסיסמה המוצפנת ב-DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// PATCH /api/auth/promote
const promote = async (req, res) => {
    try {
        const { adminCode } = req.body;

        // אותו קוד מנהל שמשמש גם בהרשמה - מוגדר ב-ENV בלבד
        const isValidCode = !!process.env.ADMIN_SIGNUP_CODE && adminCode === process.env.ADMIN_SIGNUP_CODE;
        if (!isValidCode) {
            return res.status(400).json({ message: 'Invalid admin code' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = 'admin';
        await user.save();

        // מנפיקים טוקן חדש כי ה-role מקודד בתוך ה-JWT
        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { signup, login, promote };
