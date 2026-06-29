const jwt = require('jsonwebtoken');

// מאמת שה-Token תקין ומוסיף את פרטי המשתמש ל-req
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, role }
        next();
    } catch (err) {
        res.status(401).json({ message: 'Not authorized, invalid token' });
    }
};

// בודק שהמשתמש הוא admin
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied, admins only' });
    }
    next();
};

module.exports = { protect, adminOnly };
