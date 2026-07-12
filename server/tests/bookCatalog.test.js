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
const BookHistory = require('../models/BookHistory');

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
        BookHistory.deleteMany({}),
    ]);
});

const tokenFor = (user) =>
    jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET);

const makeUser = (overrides = {}) =>
    User.create({ name: 'Test User', email: `${Date.now()}${Math.random()}@test.com`, password: 'hashed', ...overrides });

const makeAdmin = () => makeUser({ role: 'admin' });

const makeCategory = () => Category.create({ name: 'Fiction' });

const validBookPayload = (overrides = {}) => ({
    title: 'Some Book',
    author: 'Some Author',
    isbn: '0306406152',
    publisher: 'Some Publisher',
    publishedYear: 2020,
    totalCopies: 2,
    ...overrides,
});

describe('POST /api/books (add / catalog merge)', () => {
    test('creates a new book when the ISBN does not exist yet', async () => {
        const admin = await makeAdmin();
        const category = await makeCategory();

        const res = await request(app)
            .post('/api/books')
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send(validBookPayload({ category: category._id.toString() }));

        expect(res.status).toBe(201);
        expect(res.body.isbn).toBe('0306406152');
        expect(res.body.totalCopies).toBe(2);
        expect(res.body.availableCopies).toBe(2);

        const history = await BookHistory.find({ book: res.body._id });
        expect(history).toHaveLength(1);
        expect(history[0].action).toBe('created');
    });

    test('merges copies into the existing book instead of creating a duplicate when ISBN already exists', async () => {
        const admin = await makeAdmin();
        const category = await makeCategory();
        const existing = await Book.create({
            title: 'Some Book', author: 'Some Author', isbn: '0306406152',
            category: category._id, totalCopies: 3, availableCopies: 1,
        });

        const res = await request(app)
            .post('/api/books')
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send(validBookPayload({ category: category._id.toString(), totalCopies: 2 }));

        expect(res.status).toBe(200);
        expect(res.body._id).toBe(existing._id.toString());
        expect(res.body.totalCopies).toBe(5);
        expect(res.body.availableCopies).toBe(3);

        const count = await Book.countDocuments();
        expect(count).toBe(1);

        const history = await BookHistory.find({ book: existing._id });
        expect(history).toHaveLength(1);
        expect(history[0].action).toBe('copies_added');
    });

    test('rejects creation when a required field is missing', async () => {
        const admin = await makeAdmin();
        const category = await makeCategory();

        const res = await request(app)
            .post('/api/books')
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send(validBookPayload({ category: category._id.toString(), publisher: undefined }));

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/publisher/);
    });

    test('rejects creation with an invalid ISBN format', async () => {
        const admin = await makeAdmin();
        const category = await makeCategory();

        const res = await request(app)
            .post('/api/books')
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send(validBookPayload({ category: category._id.toString(), isbn: '123' }));

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid ISBN format');
    });

    test('rejects creation when the category does not exist', async () => {
        const admin = await makeAdmin();
        const missingCategoryId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .post('/api/books')
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send(validBookPayload({ category: missingCategoryId.toString() }));

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Category not found');
    });

    test('rejects creation by a non-admin user', async () => {
        const user = await makeUser();
        const category = await makeCategory();

        const res = await request(app)
            .post('/api/books')
            .set('Authorization', `Bearer ${tokenFor(user)}`)
            .send(validBookPayload({ category: category._id.toString() }));

        expect(res.status).toBe(403);
    });

    test('rejects creation without a valid auth token', async () => {
        const category = await makeCategory();

        const res = await request(app)
            .post('/api/books')
            .send(validBookPayload({ category: category._id.toString() }));

        expect(res.status).toBe(401);
    });
});

describe('PATCH /api/books/:id (edit + history)', () => {
    test('updates fields and records an audit history entry with old/new values', async () => {
        const admin = await makeAdmin();
        const category = await makeCategory();
        const book = await Book.create({
            title: 'Old Title', author: 'Old Author', isbn: '0306406152',
            publisher: 'Old Publisher', category: category._id, totalCopies: 2, availableCopies: 2,
        });

        const res = await request(app)
            .patch(`/api/books/${book._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send({ title: 'New Title', publisher: 'New Publisher' });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('New Title');
        expect(res.body.publisher).toBe('New Publisher');

        const history = await BookHistory.find({ book: book._id });
        expect(history).toHaveLength(1);
        expect(history[0].action).toBe('updated');
        const fields = history[0].changes.map((c) => c.field).sort();
        expect(fields).toEqual(['publisher', 'title']);
    });

    test('rejects reducing totalCopies below the number currently on loan', async () => {
        const admin = await makeAdmin();
        const category = await makeCategory();
        const book = await Book.create({
            title: 'Book', author: 'Author', isbn: '0306406152',
            category: category._id, totalCopies: 3, availableCopies: 1,
        });

        const res = await request(app)
            .patch(`/api/books/${book._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send({ totalCopies: 1 });

        expect(res.status).toBe(400);

        const unchanged = await Book.findById(book._id);
        expect(unchanged.totalCopies).toBe(3);
    });

    test('rejects updating to an ISBN that belongs to another book', async () => {
        const admin = await makeAdmin();
        const category = await makeCategory();
        await Book.create({
            title: 'Book A', author: 'Author', isbn: '0306406152',
            category: category._id, totalCopies: 1, availableCopies: 1,
        });
        const bookB = await Book.create({
            title: 'Book B', author: 'Author', isbn: '0136091814',
            category: category._id, totalCopies: 1, availableCopies: 1,
        });

        const res = await request(app)
            .patch(`/api/books/${bookB._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`)
            .send({ isbn: '0306406152' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('ISBN already belongs to another book');
    });
});

describe('DELETE /api/books/:id (blocked while on loan)', () => {
    test('deletes a book with no active loans', async () => {
        const admin = await makeAdmin();
        const category = await makeCategory();
        const book = await Book.create({
            title: 'Book', author: 'Author', isbn: '0306406152',
            category: category._id, totalCopies: 1, availableCopies: 1,
        });

        const res = await request(app)
            .delete(`/api/books/${book._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`);

        expect(res.status).toBe(200);
        const found = await Book.findById(book._id);
        expect(found).toBeNull();

        const history = await BookHistory.find({ book: book._id });
        expect(history).toHaveLength(1);
        expect(history[0].action).toBe('deleted');
    });

    test('rejects deletion when the book has copies currently on loan', async () => {
        const admin = await makeAdmin();
        const borrower = await makeUser();
        const category = await makeCategory();
        const book = await Book.create({
            title: 'Book', author: 'Author', isbn: '0306406152',
            category: category._id, totalCopies: 1, availableCopies: 0,
        });
        await Loan.create({ user: borrower._id, book: book._id, dueDate: new Date(), status: 'active' });

        const res = await request(app)
            .delete(`/api/books/${book._id}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Cannot delete a book with copies currently on loan');

        const stillExists = await Book.findById(book._id);
        expect(stillExists).not.toBeNull();
    });

    test('returns 404 when the book does not exist', async () => {
        const admin = await makeAdmin();
        const missingId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .delete(`/api/books/${missingId}`)
            .set('Authorization', `Bearer ${tokenFor(admin)}`);

        expect(res.status).toBe(404);
    });
});
