const User = require('../models/User');
const Loan = require('../models/Loan');

const NATIONAL_ID_SEARCH_REGEX = /^\d{5,9}$/;

const sixMonthsAgo = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d;
};

// "פעיל" - יש לפחות השאלה אחת (loanDate) ב-6 החודשים האחרונים. מחושב דינמית, לא נשמר כשדה.
const computeStatus = async (userId) => {
    const recentLoan = await Loan.findOne({ user: userId, loanDate: { $gte: sixMonthsAgo() } });
    return recentLoan ? 'active' : 'inactive';
};

// ולידציית ספרת ביקורת לתעודת זהות ישראלית
const isValidNationalId = (id) => {
    const clean = String(id).trim();
    if (!/^\d{1,9}$/.test(clean)) return false;
    const padded = clean.padStart(9, '0');
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        let digit = Number(padded[i]) * ((i % 2) + 1);
        if (digit > 9) digit -= 9;
        sum += digit;
    }
    return sum % 10 === 0;
};

// GET /api/members?search=...  (admin only)
const searchMembers = async (req, res) => {
    try {
        const search = (req.query.search || '').trim();
        if (!search) {
            return res.json([]);
        }

        const filter = { $or: [{ name: { $regex: search, $options: 'i' } }] };

        if (/^\d+$/.test(search)) {
            filter.$or.push({ memberNumber: Number(search) });
        }
        if (NATIONAL_ID_SEARCH_REGEX.test(search)) {
            filter.$or.push({ nationalId: search.padStart(9, '0') });
        }

        const users = await User.find(filter).select('-password');
        const results = await Promise.all(users.map(async (u) => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            memberNumber: u.memberNumber ?? null,
            role: u.role,
            status: await computeStatus(u._id),
        })));

        res.json(results);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/members/:id  (admin only)
const getMemberById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Member not found' });
        }

        const [status, currentLoans, loanHistory] = await Promise.all([
            computeStatus(user._id),
            Loan.find({ user: user._id, status: 'active' }).populate('book', 'title author coverImage'),
            Loan.find({ user: user._id }).populate('book', 'title author coverImage').sort({ loanDate: -1 }),
        ]);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            memberNumber: user.memberNumber ?? null,
            nationalId: user.nationalId ?? null,
            role: user.role,
            status,
            currentLoans,
            loanHistory,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// PATCH /api/members/:id  (admin only) - סטטוס וmemberNumber אינם ניתנים לעריכה כאן (מחושב/מוקצה אוטומטית)
const updateMember = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Member not found' });
        }

        if (req.body.name !== undefined) {
            const name = String(req.body.name).trim();
            if (!name) {
                return res.status(400).json({ message: 'Name is required' });
            }
            user.name = name;
        }

        if (req.body.email !== undefined) {
            const email = String(req.body.email).trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }
            const duplicate = await User.findOne({ email, _id: { $ne: user._id } });
            if (duplicate) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            user.email = email;
        }

        if (req.body.nationalId !== undefined) {
            const raw = String(req.body.nationalId).trim();
            if (raw === '') {
                // מחיקת ת.ז קיימת - מסירים את השדה לגמרי כדי לא לשבור את ה-sparse unique index
                user.nationalId = undefined;
            } else {
                if (!isValidNationalId(raw)) {
                    return res.status(400).json({ message: 'Invalid national ID' });
                }
                const padded = raw.padStart(9, '0');
                const duplicate = await User.findOne({ nationalId: padded, _id: { $ne: user._id } });
                if (duplicate) {
                    return res.status(400).json({ message: 'National ID already belongs to another member' });
                }
                user.nationalId = padded;
            }
        }

        await user.save();

        const status = await computeStatus(user._id);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            memberNumber: user.memberNumber ?? null,
            nationalId: user.nationalId ?? null,
            role: user.role,
            status,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { searchMembers, getMemberById, updateMember, computeStatus, isValidNationalId };
