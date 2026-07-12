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

const makeUser = (overrides = {}) =>
    User.create({ name: 'Test User', email: `${Date.now()}${Math.random()}@test.com`, password: 'hashed', ...overrides });

const makeBook = async () => {
    const category = await Category.create({ name: 'Fiction' });
    return Book.create({ title: 'Some Book', author: 'Some Author', category: category._id, totalCopies: 1, availableCopies: 0 });
};

describe('PATCH /api/loans/:id/extend', () => {
    test('extends a valid active loan by 14 days and increments extensionsCount', async () => {
        const user = await makeUser();
        const book = await makeBook();
        const originalDueDate = new Date('2026-01-01T00:00:00.000Z');
        const loan = await Loan.create({ user: user._id, book: book._id, dueDate: originalDueDate });

        const res = await request(app)
            .patch(`/api/loans/${loan._id}/extend`)
            .set('Authorization', `Bearer ${tokenFor(user)}`);

        expect(res.status).toBe(200);
        expect(res.body.extensionsCount).toBe(1);
        const expectedDueDate = new Date(originalDueDate);
        expectedDueDate.setDate(expectedDueDate.getDate() + 14);
        expect(new Date(res.body.dueDate).toISOString()).toBe(expectedDueDate.toISOString());
    });

    test('rejects extension once the 2-renewal limit has been reached', async () => {
        const user = await makeUser();
        const book = await makeBook();
        const loan = await Loan.create({ user: user._id, book: book._id, dueDate: new Date(), extensionsCount: 2 });

        const res = await request(app)
            .patch(`/api/loans/${loan._id}/extend`)
            .set('Authorization', `Bearer ${tokenFor(user)}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Extension limit reached');

        const unchanged = await Loan.findById(loan._id);
        expect(unchanged.extensionsCount).toBe(2);
    });

    test('rejects extension of a loan belonging to another user', async () => {
        const owner = await makeUser();
        const otherUser = await makeUser();
        const book = await makeBook();
        const loan = await Loan.create({ user: owner._id, book: book._id, dueDate: new Date() });

        const res = await request(app)
            .patch(`/api/loans/${loan._id}/extend`)
            .set('Authorization', `Bearer ${tokenFor(otherUser)}`);

        expect(res.status).toBe(403);
        expect(res.body.message).toBe('Not authorized');
    });

    test('rejects extension of a loan that was already returned', async () => {
        const user = await makeUser();
        const book = await makeBook();
        const loan = await Loan.create({
            user: user._id,
            book: book._id,
            dueDate: new Date(),
            status: 'returned',
            returnDate: new Date(),
        });

        const res = await request(app)
            .patch(`/api/loans/${loan._id}/extend`)
            .set('Authorization', `Bearer ${tokenFor(user)}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Book already returned');
    });

    test('returns 404 when the loan does not exist', async () => {
        const user = await makeUser();
        const missingId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .patch(`/api/loans/${missingId}/extend`)
            .set('Authorization', `Bearer ${tokenFor(user)}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Loan not found');
    });

    test('rejects requests without a valid auth token', async () => {
        const user = await makeUser();
        const book = await makeBook();
        const loan = await Loan.create({ user: user._id, book: book._id, dueDate: new Date() });

        const res = await request(app).patch(`/api/loans/${loan._id}/extend`);

        expect(res.status).toBe(401);
    });
});
