process.env.JWT_SECRET = 'test-secret';

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../app');
const User = require('../models/User');
const Book = require('../models/Book');
const Category = require('../models/Category');
const Loan = require('../models/Loan');

let mongod;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

afterEach(async () => {
    await Promise.all([
        User.deleteMany({}),
        Book.deleteMany({}),
        Category.deleteMany({}),
        Loan.deleteMany({}),
    ]);
});

const tokenFor = (user) =>
    jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET);

let memberSeq = 1;
const makeUser = (overrides = {}) =>
    User.create({
        name: 'Test User',
        email: `${Date.now()}${Math.random()}@test.com`,
        password: 'hashed',
        memberNumber: memberSeq++,
        ...overrides,
    });

const makeAdmin = () => makeUser({ role: 'admin' });

const makeBook = async () => {
    const category = await Category.create({ name: 'Fiction' });
    return Book.create({ title: 'Some Book', author: 'Some Author', category: category._id, totalCopies: 1, availableCopies: 1 });
};

const sixMonthsAgoDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d;
};

// יום אחרי הגבול = בתוך 6 החודשים (בבירור "פעיל")
const justWithinSixMonths = () => {
    const d = sixMonthsAgoDate();
    d.setDate(d.getDate() + 1);
    return d;
};

// יום לפני הגבול = מחוץ ל-6 החודשים (בבירור "לא פעיל")
const justOutsideSixMonths = () => {
    const d = sixMonthsAgoDate();
    d.setDate(d.getDate() - 1);
    return d;
};

const VALID_ID_A = '203458419';
const VALID_ID_B = '203458427';
const VALID_ID_SHORT = '1234566'; // 7 ספרות, אמור להישמר כ-001234566
const INVALID_ID = '203458410'; // ספרת ביקורת שגויה

describe('GET /api/members (search)', () => {
    test('finds a member by partial name match (case-insensitive)', async () => {
        const admin = await makeAdmin();
        await makeUser({ name: 'Yosef Cohen' });

        const res = await request(app)
            .get('/api/members?search=yosef')
            .set('Authorization', `Bearer ${tokenFor(admin)}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].name).toBe('Yosef Cohen');
        expect(res.body[0]).toHaveProperty('status');
    });

    test('finds a member by exact member number', async () => {
        const admin = await makeAdmin();
        const member = await makeUser({ name: 'Dana Levi', memberNumber: 777 });

        const res = await request(app)
            .get('/api/members?search=777')
            .set('Authorization', `Bearer ${tokenFor(admin)}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]._id).toBe(member._id.toString());
    });

    test('finds a member by exact national ID', async () => {
        const admin = await makeAdmin();
        const member = await makeUser({ name: 'Noa Bar', nationalId: VALID_ID_A });

        const res = await request(app)
            .get(`/api/members?search=${VALID_ID_A}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]._id).toBe(member._id.toString());
    });

    test('returns an empty array with no error when no member matches', async () => {
        const admin = await makeAdmin();

        const res = await request(app)
            .get('/api/members?search=NoSuchMemberXYZ')
            .set('Authorization', `Bearer ${tokenFor(admin)}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('rejects search by a non-admin user', async () => {
        const user = await makeUser();

        const res = await request(app)
            .get('/api/members?search=test')
            .set('Authorization', `Bearer ${tokenFor(user)}`);

        expect(res.status).toBe(403);
    });

    test('rejects search without a valid auth token', async () => {
        const res = await request(app).get('/api/members?search=test');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/members/:id (status computation)', () => {
    test('reports "active" when the member has a loan within the last 6 months', async () => {
        const admin = await makeAdmin();
        const member = await makeUser();
        const book = await makeBook();
        await Loan.create({ user: member._id, book: book._id, dueDate: new Date(), loanDate: justWithinSixMonths() });

        const res = await request(app)
            .get(`/api/members/${member._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('active');
        expect(res.body.loanHistory).toHaveLength(1);
    });

    test('reports "inactive" when the member has no loans at all', async () => {
        const admin = await makeAdmin();
        const member = await makeUser();

        const res = await request(app)
            .get(`/api/members/${member._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('inactive');
    });

    test('reports "inactive" when the member\'s most recent loan is just outside the 6-month window', async () => {
        const admin = await makeAdmin();
        const member = await makeUser();
        const book = await makeBook();
        await Loan.create({ user: member._id, book: book._id, dueDate: new Date(), loanDate: justOutsideSixMonths(), status: 'returned', returnDate: new Date() });

        const res = await request(app)
            .get(`/api/members/${member._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('inactive');
    });

    test('returns current (active) loans separately from full loan history', async () => {
        const admin = await makeAdmin();
        const member = await makeUser();
        const book = await makeBook();
        await Loan.create({ user: member._id, book: book._id, dueDate: new Date(), loanDate: justOutsideSixMonths(), status: 'returned', returnDate: new Date() });
        await Loan.create({ user: member._id, book: book._id, dueDate: new Date(), loanDate: justWithinSixMonths(), status: 'active' });

        const res = await request(app)
            .get(`/api/members/${member._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`);

        expect(res.status).toBe(200);
        expect(res.body.currentLoans).toHaveLength(1);
        expect(res.body.loanHistory).toHaveLength(2);
    });

    test('returns 404 when the member does not exist', async () => {
        const admin = await makeAdmin();
        const missingId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .get(`/api/members/${missingId}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Member not found');
    });
});

describe('PATCH /api/members/:id (edit)', () => {
    test('updates name and email successfully', async () => {
        const admin = await makeAdmin();
        const member = await makeUser({ name: 'Old Name', email: 'old@test.com' });

        const res = await request(app)
            .patch(`/api/members/${member._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send({ name: 'New Name', email: 'new@test.com' });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('New Name');
        expect(res.body.email).toBe('new@test.com');
    });

    test('accepts and normalizes a valid national ID, padding it to 9 digits', async () => {
        const admin = await makeAdmin();
        const member = await makeUser();

        const res = await request(app)
            .patch(`/api/members/${member._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send({ nationalId: VALID_ID_SHORT });

        expect(res.status).toBe(200);
        expect(res.body.nationalId).toBe('001234566');
    });

    test('rejects an invalid email format', async () => {
        const admin = await makeAdmin();
        const member = await makeUser();

        const res = await request(app)
            .patch(`/api/members/${member._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send({ email: 'not-an-email' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid email format');
    });

    test('rejects an email already used by another member', async () => {
        const admin = await makeAdmin();
        await makeUser({ email: 'taken@test.com' });
        const member = await makeUser({ email: 'mine@test.com' });

        const res = await request(app)
            .patch(`/api/members/${member._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send({ email: 'taken@test.com' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Email already in use');
    });

    test('rejects a national ID that fails the Israeli checksum', async () => {
        const admin = await makeAdmin();
        const member = await makeUser();

        const res = await request(app)
            .patch(`/api/members/${member._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send({ nationalId: INVALID_ID });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid national ID');
    });

    test('rejects a national ID already belonging to another member', async () => {
        const admin = await makeAdmin();
        await makeUser({ nationalId: VALID_ID_A });
        const member = await makeUser({ nationalId: VALID_ID_B });

        const res = await request(app)
            .patch(`/api/members/${member._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send({ nationalId: VALID_ID_A });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('National ID already belongs to another member');
    });

    test('allows clearing an existing national ID', async () => {
        const admin = await makeAdmin();
        const member = await makeUser({ nationalId: VALID_ID_A });

        const res = await request(app)
            .patch(`/api/members/${member._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send({ nationalId: '' });

        expect(res.status).toBe(200);
        expect(res.body.nationalId).toBeNull();
    });

    test('does not allow the status field to be set manually', async () => {
        const admin = await makeAdmin();
        const member = await makeUser();

        const res = await request(app)
            .patch(`/api/members/${member._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send({ status: 'active' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('inactive'); // מחושב, לא נלקח מהבקשה - אין השאלות בכלל
    });

    test('returns 404 when the member does not exist', async () => {
        const admin = await makeAdmin();
        const missingId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .patch(`/api/members/${missingId}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send({ name: 'Whoever' });

        expect(res.status).toBe(404);
    });

    test('rejects updates by a non-admin user', async () => {
        const user = await makeUser();
        const member = await makeUser();

        const res = await request(app)
            .patch(`/api/members/${member._id}`)
            .set('Authorization', `Bearer ${tokenFor(user)}`)
            .send({ name: 'Hacked Name' });

        expect(res.status).toBe(403);
    });
});
