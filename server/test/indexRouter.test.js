const describe = require('@jest/globals').describe;
const expect = require('@jest/globals').expect;
const test = require('@jest/globals').test;
const beforeAll = require('@jest/globals').beforeAll;
const beforeEach = require('@jest/globals').beforeEach;
const afterAll = require('@jest/globals').afterAll;

const request = require('supertest');

const express = require('express');
const app = express();

var expressWs = require('express-ws')(app);
const db = require('./mongoTestingConfig');
require('../initPassport');
require('dotenv').config();
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

const indexRouter = require('../routes/index');
const chatRouter = require('../routes/chat');
const errorHandlers = require('../routes/error');

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.use('/', indexRouter);
app.use('/', chatRouter);
app.use('/', errorHandlers.catch);
app.use('/', errorHandlers.handle);

let user1ID;

beforeAll(async () => {
  await db.initializeMongoServer();
});

beforeEach(async () => {
  await User.deleteMany({});
  const user = await new User({
    username: 'user1',
    password: await bcrypt.hash('password1', 10),
  }).save();
  user1ID = user._id;
});

afterAll(async () => {
  db.terminateMongoConnection();
});

describe('User Creation', () => {
  test('User create works', async () => {
    const payload = { username: 'user2', password: 'password1' };
    const test = await request(app)
      .post('/user/create')
      .send(payload)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(test.body.message).toBe('User user2 Created');
    expect(test.body.token).toBeDefined();
    expect(test.body.id).toBeDefined();
  });

  test('Cannot create user with taken username', async () => {
    const payload = { username: 'user1', password: 'password1' };
    const test = await request(app)
      .post('/user/create')
      .send(payload)
      .expect('Content-Type', /json/)
      .expect(409);

    expect(test.body.message).toBe('Name Already In Use');
  });

  test('Cannot create user with short username', async () => {
    const payload = { username: 'us', password: 'password1' };
    const test = await request(app)
      .post('/user/create')
      .send(payload)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(test.body).toEqual([
      {
        type: 'field',
        value: 'us',
        msg: 'Username must be at least 3 characters long.',
        path: 'username',
        location: 'body',
      },
    ]);
  });

  test('Cannot create user with short password', async () => {
    const payload = { username: 'user2', password: 'pa' };
    const test = await request(app)
      .post('/user/create')
      .send(payload)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(test.body).toEqual([
      {
        type: 'field',
        value: 'pa',
        msg: 'Password must be at least 3 characters long.',
        path: 'password',
        location: 'body',
      },
    ]);
  });

  test('Cannot create user with no username', async () => {
    const payload = { username: '', password: 'password1' };
    const test = await request(app)
      .post('/user/create')
      .send(payload)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(test.body).toEqual([
      {
        type: 'field',
        value: '',
        msg: 'Username must be at least 3 characters long.',
        path: 'username',
        location: 'body',
      },
    ]);
  });

  test('Cannot create user with no password', async () => {
    const payload = { username: 'user2', password: '' };
    const test = await request(app)
      .post('/user/create')
      .send(payload)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(test.body).toEqual([
      {
        type: 'field',
        value: '',
        msg: 'Password must be at least 3 characters long.',
        path: 'password',
        location: 'body',
      },
    ]);
  });
});

describe('Login', () => {
  test('Login Works', async () => {
    const payload = { username: 'user1', password: 'password1' };
    const test = await request(app)
      .post('/login')
      .send(payload)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(test.body.message).toBe('Login Successful');
    expect(test.body.token).toBeDefined();
    expect(test.body.id).toBe(user1ID.toString());
  });

  test('Login wrong password', async () => {
    const payload = { username: 'user1', password: 'WRONG' };
    const test = await request(app)
      .post('/login')
      .send(payload)
      .expect('Content-Type', /json/)
      .expect(401);

    expect(test.body.message).toBe('Login Unsuccessful');
    expect(test.body.token).toBeUndefined();
    expect(test.body.id).toBeUndefined();
  });

  test('Login non existent user', async () => {
    const payload = { username: 'user999', password: 'password1' };
    const test = await request(app)
      .post('/login')
      .send(payload)
      .expect('Content-Type', /json/)
      .expect(401);

    expect(test.body.message).toBe('Login Unsuccessful');
    expect(test.body.token).toBeUndefined();
  });
});
