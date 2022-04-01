const request = require('supertest');
const express = require('express');
const { startMongoServer, stopMongoServer } = require('./mongoConfigTesting');
const User = require('../models/user');

require('../passport');

const indexRouter = require('../routes/index');
const usersRouter = require('../routes/users')
const postsRouter = require('../routes/posts');

const app = express(); // Set up a separate express app

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/api', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);

let token;
let user;
let post;
let comment;

beforeAll(async () => {
    await startMongoServer();

    // Insert mock data

    // Create User
    let response = await request(app)
    .post('/api/users/create')
    .send({
        username: 'test',
        password: 'test',
        firstName: 'test',
        lastName: 'test',
        public: true,
        admin: false
    });

    user = response.body.user;

    // Log In
    response = await request(app)
    .post('/api/log-in')
    .send({
        username: 'test',
        password: 'test'
    });

    token = response.body.token;

    // Create Post
    response = await request(app)
    .post('/api/posts/create')
    .set('Authorization', 'Bearer ' + token)
    .send({
        author: user.id,
        date: new Date(),
        content: 'test',
        image: 'test',
        public: true
    });

    post = response.body.post;

    // Create Comment
    response = await request(app)
    .post('/api/posts/' + post.id + '/comments/create')
    .set('Authorization', 'Bearer ' + token)
    .send({
        post: post.id,
        author: user.id,
        date: new Date(),
        content: 'test',
        public: true
    });

    comment = response.body.comment;
});

/* Template
test('This is a test', done => {
    request(app).get('/')
        .expect('Content-Type', /json/)
        .expect(200, done);

test('This is an async/await test', async () => {
    const response = await request(app).get('/');
    expect(response.headers['content-type']).toMatch(/json/);
});*/

// Get Posts
test('GET /api/posts', async () => {
    const response = await request(app).get('/api/posts');
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toEqual(1);
});

// Get Post
test('GET /api/posts/:postId', async () => {
    const response = await request(app).get('/api/posts/' + post.id);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(200);
    expect(response.body._id).toEqual(post.id);
});

// Get Post Comments
test('GET /api/posts/:postId/comments', async () => {
    const response = await request(app).get('/api/posts/' + post.id + '/comments');
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toEqual(1);
});

// Update Post
test('POST /api/posts/:postId/update', async () => {
    const response = await request(app).post('/api/posts/' + post.id + '/update')
    .set('Authorization', 'Bearer ' + token)
    .send({
        content: 'test2',
    });
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(200);
    expect(response.body.post.content).toEqual('test2');
});

// Update Comment
test('POST /api/posts/:postId/comments/:commentId/update', async () => {
    const response = await request(app).post('/api/posts/' + post.id + '/comments/' + comment.id + '/update')
    .set('Authorization', 'Bearer ' + token)
    .send({
        content: 'test2',
    });
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(200);
    expect(response.body.comment.content).toEqual('test2');
});

// Delete Post
test('POST /api/posts/:postId/delete', async () => {
    const response = await request(app).post('/api/posts/' + post.id + '/delete')
    .set('Authorization', 'Bearer ' + token);
    expect(response.body.message).toEqual('Success');
});

afterAll(async () => {
    await stopMongoServer();
});