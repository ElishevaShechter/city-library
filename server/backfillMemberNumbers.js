// הרצה חד-פעמית: מקצה מספר חבר לכל משתמש קיים שנוצר לפני הוספת שדה memberNumber.
// שימוש: node backfillMemberNumbers.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Counter = require('./models/Counter');

(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const usersWithoutNumber = await User.find({ memberNumber: { $exists: false } }).sort({ createdAt: 1 });

    for (const user of usersWithoutNumber) {
        const counter = await Counter.findByIdAndUpdate(
            'memberNumber',
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        user.memberNumber = counter.seq;
        await user.save();
        console.log(`Assigned memberNumber ${counter.seq} to ${user.email}`);
    }

    console.log(`Done. Backfilled ${usersWithoutNumber.length} member(s).`);
    await mongoose.disconnect();
})();
