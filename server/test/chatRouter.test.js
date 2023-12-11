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
const jwt = require('jsonwebtoken');

const Chat = require('../models/Chat');
const User = require('../models/user');

const indexRouter = require('../routes/index');
const chatRouter = require('../routes/chat');
const errorHandlers = require('../routes/error');
const { default: mongoose } = require('mongoose');

const fs = require('fs');
const { send } = require('process');

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

beforeAll(async () => {
  await db.initializeMongoServer();
});

let user1;
let user2;
let user3;
let user4;
let chat1;
let chat2;

beforeEach(async () => {
  await User.deleteMany({});
  await Chat.deleteMany({});
  user1 = new User({
    username: 'user1',
    password: await bcrypt.hash('password1', 10),
  });
  user2 = new User({
    username: 'user2',
    password: await bcrypt.hash('password2', 10),
  });
  user3 = new User({
    username: 'user3',
    password: await bcrypt.hash('password3', 10),
  });
  user4 = new User({
    username: 'user4',
    password: await bcrypt.hash('password4', 10),
  });

  chat1 = new Chat({
    users: [user1._id, user2._id, user3._id],
  });
  chat2 = new Chat({
    users: [user3._id, user4._id],
  });

  user1.chats.push(chat1._id);
  user2.chats.push(chat1._id);
  user3.chats.push(chat1._id);
  user3.chats.push(chat2._id); // user4 will have chat2 "deleted"

  await user1.save();
  await user2.save();
  await user3.save();
  await user4.save();

  await chat1.save();
  await chat2.save();
});

afterAll(async () => {
  db.terminateMongoConnection();
});

jest.setTimeout(600000);

describe('/user/:id', () => {
  test('get user by id works', async () => {
    const test = await request(app)
      .get('/user/' + user1._id)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(test.body.username).toBe('user1');
    expect(test.body.profileImage).toBeDefined();
  });

  test('get non existent user by id', async () => {
    const nonUser = new User({ username: 'UNDEFINED', password: 'UNDEFINED' });
    const test = await request(app)
      .get('/user/' + nonUser._id)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(test.body).toBe(`User with id ${nonUser._id} does not exist`);
  });

  test('get user with invalid id', async () => {
    const test = await request(app)
      .get('/user/' + 'NONSENSE')
      .expect('Content-Type', /json/)
      .expect(400);

    expect(test.body).toBe('User ID is not valid.');
    expect(test.body.profileImage).toBeUndefined();
    expect(test.body.profileImage).toBeUndefined();
  });
});

describe('/search/:query', () => {
  test('Search works', async () => {
    new User({
      username: 'NewMan',
      password: 'password',
    }).save();
    const test = await request(app)
      .get('/search/u')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(test.body.length).toBe(4);
    const usernames = test.body.map((u) => u.username);
    const userIDs = test.body.map((u) => u.id.toString());
    expect(usernames).toContain(user1.username);
    expect(usernames).toContain(user2.username);
    expect(usernames).toContain(user3.username);
    expect(usernames).toContain(user4.username);
    expect(userIDs).toContain(user1._id.toString());
    expect(userIDs).toContain(user2._id.toString());
    expect(userIDs).toContain(user3._id.toString());
    expect(userIDs).toContain(user4._id.toString());
    test.body.forEach((u) => expect(u.profileImage).toBeDefined());
  });

  test('No matching results', async () => {
    const test = await request(app)
      .get('/search/X')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(test.body).toEqual([]);
  });

  test('Empty search value', async () => {
    const test = await request(app)
      .get('/search')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(test.body).toBe('Not found.');
  });
});

describe('/user/:id/chats', () => {
  test('Get chats by user id works', async () => {
    const message = { text: 'message', from: user4._id, read: false };
    await Chat.findByIdAndUpdate(chat2._id, {
      $push: { messages: { $each: [message], $position: 0 } },
    });
    const test = await request(app)
      .get('/user/' + user3._id + '/chats')
      .set('x-access-token', getTokenForUser(user3))
      .expect('Content-Type', /json/)
      .expect(200);

    expect(test.body.length).toBe(2);
    const returnedChat1 = test.body[0];
    expect(returnedChat1.users.length).toBe(2);
    compareIDs(returnedChat1.users[0], user1._id);
    compareIDs(returnedChat1.users[1], user2._id);
    expect(returnedChat1.lastMessage).toBeUndefined();
    expect(returnedChat1.lastMessageUser).toBeNull();
    expect(returnedChat1.chatIcon).toBeDefined();
    const returnedChat2 = test.body[1];
    expect(returnedChat2.users.length).toBe(1);
    compareIDs(returnedChat2.users[0], user4._id);
    expect(returnedChat2.chatIcon).toBeDefined();
    expect(returnedChat2.lastMessage).toBeDefined();
    compareIDs(returnedChat2.lastMessageUser._id, user4._id);
  });

  test('Invalid user id', async () => {
    const test = await request(app)
      .get('/user/' + 'NONSENSE' + '/chats')
      .set('x-access-token', getTokenForUser(user1))
      .expect('Content-Type', /json/)
      .expect(400);

    expect(test.body).toEqual('User ID is not valid.');
  });

  test('Non existent user id', async () => {
    const nonexistentUser = new User({
      username: 'nonexistent',
      password: 'nonexistent',
    });
    const test = await request(app)
      .get('/user/' + nonexistentUser._id + '/chats')
      .set('x-access-token', getTokenForUser(nonexistentUser))
      .expect('Content-Type', /json/)
      .expect(400);

    expect(test.body).toEqual(
      `User with id ${nonexistentUser._id} does not exist.`
    );
  });

  test('Get another user chats', async () => {
    const test = await request(app)
      .get('/user/' + user3._id + '/chats')
      .set('x-access-token', getTokenForUser(user1))
      .expect('Content-Type', /json/)
      .expect(403);

    expect(test.body).toEqual('Cannot get chats of another user.');
  });
});

describe('/chat/:id', () => {
  test('Get chat by id works', async () => {
    const test = await request(app)
      .get('/chat/' + chat1._id)
      .set('x-access-token', getTokenForUser(user1))
      .expect('Content-Type', /json/)
      .expect(200);

    expect(test.body).toBeDefined();

    const chat = test.body;

    compareIDs(chat._id, chat1._id);
    expect(chat.messages).toEqual([]);
    expect(chat.users.length).toBe(3);
    const chatUser1 = chat.users[0];
    const chatUser2 = chat.users[1];
    compareIDs(chatUser1._id, user1._id);
    compareIDs(chatUser2._id, user2._id);
    expect(chatUser1.password).toBeUndefined();
    expect(chatUser2.password).toBeUndefined();
  });

  test('Get chat invalid id', async () => {
    const test = await request(app)
      .get('/chat/' + 'NONSENSE')
      .set('x-access-token', getTokenForUser(user1))
      .expect('Content-Type', /json/)
      .expect(400);

    expect(test.body).toEqual('Chat ID is not valid.');
  });

  test('Get chat nonexistent id', async () => {
    const nonexistentChat = new Chat({ users: [user1._id, user2._id] });
    const test = await request(app)
      .get('/chat/' + nonexistentChat._id)
      .set('x-access-token', getTokenForUser(user1))
      .expect('Content-Type', /json/)
      .expect(400);

    expect(test.body).toEqual('Chat does not exist.');
  });

  test('Get chat with user not in chat', async () => {
    const test = await request(app)
      .get('/chat/' + chat1._id)
      .set('x-access-token', getTokenForUser(user4))
      .expect('Content-Type', /json/)
      .expect(403);

    expect(test.body).toEqual(
      'You do not have permissions to access this chat.'
    );
  });
});

describe('/chatdata/:id', () => {
  test('Get chat data by id works', async () => {
    const message1 = { text: 'msg1', from: user2._id, read: false };
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message1], $position: 0 } },
    });
    const test = await request(app)
      .get('/chatdata/' + chat1._id)
      .set('x-access-token', getTokenForUser(user1))
      .expect('Content-Type', /json/)
      .expect(200);

    expect(test.body).toBeDefined();

    const chat = test.body;

    compareIDs(chat.id, chat1._id);
    expect(chat.chatIcon).toBeDefined();
    expect(chat.lastMessage.text).toBe('msg1');
    compareIDs(chat.lastMessage.from, user2._id);
    expect(chat.lastMessageUser.username).toBe('user2');
    expect(chat.lastMessageUser.profileImage).toBeDefined();
  });

  test('Get chat invalid id', async () => {
    const test = await request(app)
      .get('/chatdata/' + 'NONSENSE')
      .set('x-access-token', getTokenForUser(user1))
      .expect('Content-Type', /json/)
      .expect(400);

    expect(test.body).toEqual('Chat ID is not valid.');
  });

  test('Get chat nonexistent id', async () => {
    const nonexistentChat = new Chat({ users: [user1._id, user2._id] });
    const test = await request(app)
      .get('/chatdata/' + nonexistentChat._id)
      .set('x-access-token', getTokenForUser(user1))
      .expect('Content-Type', /json/)
      .expect(400);

    expect(test.body).toEqual('Chat does not exist.');
  });

  test('Get chat with user not in chat', async () => {
    const test = await request(app)
      .get('/chatdata/' + chat1._id)
      .set('x-access-token', getTokenForUser(user4))
      .expect('Content-Type', /json/)
      .expect(403);

    expect(test.body).toEqual(
      'You do not have permissions to access this chat.'
    );
  });
});

describe('/chat/user/:id', () => {
  test('Get chat by recipient id works', async () => {
    const test = await request(app)
      .get('/chat/user/' + user4._id)
      .set('x-access-token', getTokenForUser(user3))
      .expect('Content-Type', /json/)
      .expect(200);

    expect(test.body).toBeDefined();

    const chat = test.body;

    compareIDs(chat._id, chat2._id);
    expect(chat.messages).toEqual([]);
    expect(chat.users.length).toBe(2);
    const chatUser1 = chat.users[0];
    const chatUser2 = chat.users[1];
    compareIDs(chatUser1._id, user3._id);
    compareIDs(chatUser2._id, user4._id);
    expect(chatUser1.password).toBeUndefined();
    expect(chatUser2.password).toBeUndefined();
  });

  test('Get chat by recipient id works when chat deleted', async () => {
    expect(user4.chats.length).toBe(0);
    const test = await request(app)
      .get('/chat/user/' + user3._id)
      .set('x-access-token', getTokenForUser(user4))
      .expect('Content-Type', /json/)
      .expect(200);

    expect(test.body).toBeDefined();

    const chat = test.body;
    const newUser4 = await User.findById(user4._id).exec();

    expect(newUser4.chats.length).toBe(1);
    compareIDs(chat._id, chat2._id);
    expect(chat.messages).toEqual([]);
    expect(chat.users.length).toBe(2);
    const chatUser1 = chat.users[0];
    const chatUser2 = chat.users[1];
    compareIDs(chatUser1._id, user3._id);
    compareIDs(chatUser2._id, user4._id);
    expect(chatUser1.password).toBeUndefined();
    expect(chatUser2.password).toBeUndefined();
  });

  test('Get chat with yourself', async () => {
    const test = await request(app)
      .get('/chat/user/' + user4._id)
      .set('x-access-token', getTokenForUser(user4))
      .expect('Content-Type', /json/)
      .expect(501);

    expect(test.body).toBe('Not yet available.');
  });

  test('Get nonexistent chat by recipient id', async () => {
    const test = await request(app)
      .get('/chat/user/' + user4._id)
      .set('x-access-token', getTokenForUser(user1))
      .expect('Content-Type', /json/)
      .expect(404);

    expect(test.body).toBe('Chat not found.');
  });

  test('Fail to get group chat by recipient id', async () => {
    const test = await request(app)
      .get('/chat/user/' + user2._id)
      .set('x-access-token', getTokenForUser(user1))
      .expect('Content-Type', /json/)
      .expect(404);

    expect(test.body).toBe('Chat not found.');
  });
});

describe('/chat/:id/message/send', () => {
  test('Send message to chat by chat ID works', async () => {
    expect(chat1.messages.length).toBe(0);
    const response = await request(app)
      .post(`/chat/${chat1._id.toString()}/message/send/`)
      .set('x-access-token', getTokenForUser(user1))
      .send({ text: 'These' })
      .expect('Content-Type', /json/)
      .expect(200);

    const message = response.body.message;
    expect(message.text).toBe('These');
    expect(message._id).toBeDefined();
    expect(message.from).toBeDefined();
    const newChat1 = await Chat.findById(chat1._id).exec();
    expect(newChat1.messages.length).toBe(1);
    compareIDs(newChat1.messages[0].from, user1._id);
    expect(newChat1.messages[0].text).toBe('These');
  });

  test('Send message to chat empty message', async () => {
    const response = await request(app)
      .post(`/chat/${chat1._id.toString()}/message/send/`)
      .set('x-access-token', getTokenForUser(user1))
      .send({ text: '' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.length).toBe(1);
    expect(response.body[0]).toBe('Message must not be empty.');
  });

  test('Send message to chat invalid chat ID', async () => {
    const response = await request(app)
      .post(`/chat/NONSENSE/message/send/`)
      .set('x-access-token', getTokenForUser(user1))
      .send({ text: 'These' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toBe('Chat ID is not valid.');
  });

  test('Send message to inaccessible chat', async () => {
    const response = await request(app)
      .post(`/chat/${chat2._id.toString()}/message/send/`)
      .set('x-access-token', getTokenForUser(user1))
      .send({ text: 'These' })
      .expect('Content-Type', /json/)
      .expect(403);

    expect(response.body).toBe(
      'You do not have permissions to access this chat.'
    );
  });
});

describe('/chat/:chatId/message/:msgId/delete', () => {
  test('Delete message works', async () => {
    const message1 = {
      _id: new mongoose.Types.ObjectId(),
      text: 'msg1',
      from: user1._id,
      read: false,
    };
    const message2 = { text: 'msg2', from: user2._id, read: false };
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message1], $position: 0 } },
    });
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message2], $position: 0 } },
    });

    const response = await request(app)
      .post(`/chat/${chat1._id}/message/${message1._id}/delete`)
      .set('x-access-token', getTokenForUser(user1))
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.message).toBe('Message deleted.');
    expect(response.body.isLastMessage).toBe(false);
    const newChat1 = await Chat.findById(chat1._id).exec();
    expect(newChat1.messages.length).toBe(1);
    expect(newChat1.messages[0].text).toBe('msg2');
    compareIDs(newChat1.messages[0].from, user2._id);
  });
  test('Delete last message works', async () => {
    const message1 = {
      _id: new mongoose.Types.ObjectId(),
      text: 'msg1',
      from: user1._id,
      read: false,
    };
    const message2 = {
      _id: new mongoose.Types.ObjectId(),
      text: 'msg2',
      from: user2._id,
      read: false,
    };
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message1], $position: 0 } },
    });
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message2], $position: 0 } },
    });

    const response = await request(app)
      .post(`/chat/${chat1._id}/message/${message2._id}/delete`)
      .set('x-access-token', getTokenForUser(user2))
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.message).toBe('Message deleted.');
    expect(response.body.isLastMessage).toBe(true);
    const newChat1 = await Chat.findById(chat1._id).exec();
    expect(newChat1.messages.length).toBe(1);
    expect(newChat1.messages[0].text).toBe('msg1');
    compareIDs(newChat1.messages[0].from, user1._id);
  });
  test('Delete message invalid chat ID', async () => {
    const message1 = {
      _id: new mongoose.Types.ObjectId(),
      text: 'msg1',
      from: user1._id,
      read: false,
    };
    const message2 = { text: 'msg2', from: user2._id, read: false };
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message1], $position: 0 } },
    });
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message2], $position: 0 } },
    });

    const response = await request(app)
      .post(`/chat/nonsense/message/${message1._id}/delete`)
      .set('x-access-token', getTokenForUser(user2))
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toBe('Chat ID is not valid.');
  });
  test('Delete message invalid message ID', async () => {
    const message1 = {
      _id: new mongoose.Types.ObjectId(),
      text: 'msg1',
      from: user1._id,
      read: false,
    };
    const message2 = { text: 'msg2', from: user2._id, read: false };
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message1], $position: 0 } },
    });
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message2], $position: 0 } },
    });

    const response = await request(app)
      .post(`/chat/${chat1._id}/message/nonsense/delete`)
      .set('x-access-token', getTokenForUser(user2))
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toBe('Message ID is not valid.');
  });
  test('Delete message non existent chat ID', async () => {
    const message1 = {
      _id: new mongoose.Types.ObjectId(),
      text: 'msg1',
      from: user1._id,
      read: false,
    };
    const message2 = { text: 'msg2', from: user2._id, read: false };
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message1], $position: 0 } },
    });
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message2], $position: 0 } },
    });

    const response = await request(app)
      .post(
        `/chat/${new mongoose.Types.ObjectId()}/message/${message1._id}/delete`
      )
      .set('x-access-token', getTokenForUser(user2))
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toBe('Chat does not exist.');
  });
  test('Delete message with non existent message ID', async () => {
    const message1 = {
      _id: new mongoose.Types.ObjectId(),
      text: 'msg1',
      from: user1._id,
      read: false,
    };
    const message2 = { text: 'msg2', from: user2._id, read: false };
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message1], $position: 0 } },
    });
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message2], $position: 0 } },
    });
    const nonexistentMsg = new mongoose.Types.ObjectId();

    const response = await request(app)
      .post(`/chat/${chat1._id}/message/${nonexistentMsg}/delete`)
      .set('x-access-token', getTokenForUser(user2))
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toBe(
      `Message with ID ${nonexistentMsg.toString()} in chat with ID ${chat1._id.toString()} not found.`
    );
  });
  test('Delete message without permission', async () => {
    const message1 = {
      _id: new mongoose.Types.ObjectId(),
      text: 'msg1',
      from: user1._id,
      read: false,
    };
    const message2 = { text: 'msg2', from: user2._id, read: false };
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message1], $position: 0 } },
    });
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message2], $position: 0 } },
    });

    const response = await request(app)
      .post(`/chat/${chat1._id}/message/${message1._id}/delete`)
      .set('x-access-token', getTokenForUser(user2))
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toBe('Cannot delete message sent by another user.');
    const newChat1 = await Chat.findById(chat1._id).exec();
    expect(newChat1.messages.length).toBe(2);
  });
});

describe('/chat/:id/lastmessage', () => {
  test('Get last message works', async () => {
    const message1 = {
      _id: new mongoose.Types.ObjectId(),
      text: 'msg1',
      from: user1._id,
      read: false,
    };
    const message2 = { text: 'msg2', from: user2._id, read: false };
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message1], $position: 0 } },
    });
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message2], $position: 0 } },
    });

    const response = await request(app)
      .get(`/chat/${chat1._id}/lastmessage`)
      .set('x-access-token', getTokenForUser(user2))
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.message).toBe('msg2');
    expect(response.body.lastMessageUser).toBeDefined();
    compareIDs(response.body.lastMessageUser._id, user2._id);
    expect(response.body.lastMessageUser.username).toBe('user2');
    expect(response.body.lastMessageUser.profileImage).toBeDefined();
  });
  test('Get last message without permission', async () => {
    const response = await request(app)
      .get(`/chat/${chat1._id}/lastmessage`)
      .set('x-access-token', getTokenForUser(user1))
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual({});
  });
  test('Get last message invalid chat ID', async () => {
    const message1 = {
      _id: new mongoose.Types.ObjectId(),
      text: 'msg1',
      from: user1._id,
      read: false,
    };
    const message2 = { text: 'msg2', from: user2._id, read: false };
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message1], $position: 0 } },
    });
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message2], $position: 0 } },
    });

    const response = await request(app)
      .get(`/chat/nonsense/lastmessage`)
      .set('x-access-token', getTokenForUser(user2))
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toBe('Chat ID is not valid.');
  });
  test('Get last message nonexistent chat ID', async () => {
    const message1 = {
      _id: new mongoose.Types.ObjectId(),
      text: 'msg1',
      from: user1._id,
      read: false,
    };
    const message2 = { text: 'msg2', from: user2._id, read: false };
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message1], $position: 0 } },
    });
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message2], $position: 0 } },
    });

    const response = await request(app)
      .get(`/chat/${new mongoose.Types.ObjectId()}/lastmessage`)
      .set('x-access-token', getTokenForUser(user2))
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toBe('Chat does not exist.');
  });
  test('Get last message without permission', async () => {
    const message1 = {
      _id: new mongoose.Types.ObjectId(),
      text: 'msg1',
      from: user1._id,
      read: false,
    };
    const message2 = { text: 'msg2', from: user2._id, read: false };
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message1], $position: 0 } },
    });
    await Chat.findByIdAndUpdate(chat1._id, {
      $push: { messages: { $each: [message2], $position: 0 } },
    });

    const response = await request(app)
      .get(`/chat/${chat1._id}/lastmessage`)
      .set('x-access-token', getTokenForUser(user4))
      .expect('Content-Type', /json/)
      .expect(409);

    expect(response.body).toBe('User is not a member of given chat.');
  });
});

describe('/message/send', () => {
  test('Send message by recipient ID works', async () => {
    expect(chat2.messages.length).toBe(0);
    const response = await request(app)
      .post('/message/send/')
      .set('x-access-token', getTokenForUser(user3))
      .send({ recipient: user4._id, text: 'These' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.message).toBe('Message sent.');
    compareIDs(response.body.chatID, chat2._id);
    const newChat2 = await Chat.findById(chat2._id).exec();
    expect(newChat2.messages.length).toBe(1);
    compareIDs(newChat2.messages[0].from, user3._id);
    expect(newChat2.messages[0].text).toBe('These');
  });

  test('Send message by recipient ID to deleted chat', async () => {
    expect(chat2.messages.length).toBe(0);
    const response = await request(app)
      .post('/message/send/')
      .set('x-access-token', getTokenForUser(user4))
      .send({ recipient: user3._id, text: 'These' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.message).toBe('Message sent.');
    compareIDs(response.body.chatID, chat2._id);
    const newChat2 = await Chat.findById(chat2._id).exec();
    expect(newChat2.messages.length).toBe(1);
    compareIDs(newChat2.messages[0].from, user4._id);
    expect(newChat2.messages[0].text).toBe('These');
  });

  test('Send message by recipient ID to new chat', async () => {
    const response = await request(app)
      .post('/message/send/')
      .set('x-access-token', getTokenForUser(user4))
      .send({ recipient: user2._id, text: 'These' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.message).toBe('Message sent.');
    expect(response.body.chatID).toBeDefined();

    const newChat = (
      await request(app)
        .get('/chat/user/' + user4._id)
        .set('x-access-token', getTokenForUser(user2))
        .expect(200)
    ).body;

    expect(newChat.messages.length).toBe(1);
    compareIDs(newChat.messages[0].from, user4._id);
    expect(newChat.messages[0].text).toBe('These');
  });

  test('Send message with invalid recipient ID', async () => {
    expect(chat2.messages.length).toBe(0);
    const response = await request(app)
      .post('/message/send/')
      .set('x-access-token', getTokenForUser(user3))
      .send({ recipient: 'NONSENSE', text: 'These' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.length).toBe(1);
    expect(response.body[0]).toBe('Recipient ID is not valid.');
  });

  test('Send empty message by recipient ID', async () => {
    expect(chat2.messages.length).toBe(0);
    const response = await request(app)
      .post('/message/send/')
      .set('x-access-token', getTokenForUser(user3))
      .send({ recipient: user4._id, text: '' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.length).toBe(1);
    expect(response.body[0]).toBe('Message must not be empty.');
  });
});

describe('/chat/:id/user/add', () => {
  test('Add user to chat works', async () => {
    expect(chat2.users.length).toBe(2);
    const response = await request(app)
      .post(`/chat/${chat2._id}/user/add`)
      .set('x-access-token', getTokenForUser(user3))
      .send({ newUserID: user2._id })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toBe('User user2 added successfully.');
    const newChat2 = await Chat.findById(chat2._id).populate('users').exec();
    expect(newChat2.users.length).toBe(3);
    expect(newChat2.users.map((u) => u.username)).toContain('user2');
  });

  test('Add user to invalid chat', async () => {
    const response = await request(app)
      .post(`/chat/NONSENSE/user/add`)
      .set('x-access-token', getTokenForUser(user3))
      .send({ newUserID: user2._id })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toBe('Invalid chat ID.');
  });

  test('Add user with invalid ID to chat', async () => {
    const response = await request(app)
      .post(`/chat/${chat2._id}/user/add`)
      .set('x-access-token', getTokenForUser(user3))
      .send({ newUserID: 'NONSENSE' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toBe('Invalid user ID.');
  });

  test('Add nonexistent user to chat', async () => {
    const nonexistentUser = new User({
      username: 'nonexistent',
      password: 'nonexistent',
    });
    const response = await request(app)
      .post(`/chat/${chat2._id}/user/add`)
      .set('x-access-token', getTokenForUser(user3))
      .send({ newUserID: nonexistentUser._id })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toBe(
      `User with id ${nonexistentUser._id} does not exist`
    );
  });

  test('Add existing user to chat', async () => {
    const response = await request(app)
      .post(`/chat/${chat2._id}/user/add`)
      .set('x-access-token', getTokenForUser(user3))
      .send({ newUserID: user4._id })
      .expect('Content-Type', /json/)
      .expect(409);

    expect(response.body).toBe(`User user4 is already a member of this chat.`);
  });

  test('Add user to chat without permission', async () => {
    const response = await request(app)
      .post(`/chat/${chat2._id}/user/add`)
      .set('x-access-token', getTokenForUser(user1))
      .send({ newUserID: user2._id })
      .expect('Content-Type', /json/)
      .expect(403);

    expect(response.body).toBe(
      `You are not allowed to add members to this chat as you are not a member.`
    );
  });
});

describe('/chat/:id/user/remove', () => {
  test('Remove user from chat works', async () => {
    const response = await request(app)
      .post(`/chat/${chat1._id}/user/remove`)
      .set('x-access-token', getTokenForUser(user3))
      .send({ removeUserID: user3._id })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toBe('User user3 removed from chat.');
    const newChat1 = await Chat.findById(chat1._id).populate('users').exec();
    expect(newChat1.users.length).toBe(2);
    expect(newChat1.users.map((u) => u.username).includes('user3')).toBeFalsy();
  });

  test('Remove user from chat he does not belong to', async () => {
    const response = await request(app)
      .post(`/chat/${chat2._id}/user/remove`)
      .set('x-access-token', getTokenForUser(user3))
      .send({ removeUserID: user1._id })
      .expect('Content-Type', /json/)
      .expect(409);

    expect(response.body).toBe('User user1 is not a member of this chat.');
  });

  test('Remove user from invalid chat', async () => {
    const response = await request(app)
      .post(`/chat/NONSENSE/user/remove`)
      .set('x-access-token', getTokenForUser(user1))
      .send({ removeUserID: user1._id })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toBe('Invalid chat ID.');
  });

  test('Remove user from nonexistent chat', async () => {
    const nonexistentChat = new Chat({ users: [user1._id, user2._id] });
    const response = await request(app)
      .post(`/chat/${nonexistentChat._id}/user/remove`)
      .set('x-access-token', getTokenForUser(user1))
      .send({ removeUserID: user2._id })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toBe(`Chat does not exist.`);
  });

  test('Remove invalid user from chat', async () => {
    const response = await request(app)
      .post(`/chat/${chat2._id}/user/remove`)
      .set('x-access-token', getTokenForUser(user3))
      .send({ removeUserID: 'NONSENSE' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toBe(`Invalid user ID.`);
  });

  test('Remove user from chat with no permission', async () => {
    const response = await request(app)
      .post(`/chat/${chat2._id}/user/remove`)
      .set('x-access-token', getTokenForUser(user1))
      .send({ removeUserID: user3._id })
      .expect('Content-Type', /json/)
      .expect(403);

    expect(response.body).toBe(
      `You are not allowed to remove members from this chat as you are not a member.`
    );
  });
});

describe('/user/:id/image/set', () => {
  test('Set user image works', async () => {
    const newProfileImage = fs.readFileSync(
      './test/testResources/chatRouter/testImage.jpg',
      {
        encoding: 'base64',
      }
    );
    const response = await request(app)
      .post(`/user/${user1._id}/image/set`)
      .set('x-access-token', getTokenForUser(user1))
      .send({ image: newProfileImage })
      .expect('Content-Type', /json/)
      .expect(200);

    const newUser1 = await User.findById(user1._id).exec();

    expect(Buffer.from(newUser1.profileImage.data).toString()).toBe(
      newProfileImage
    );
  });
  test('Set user image with base64 string works', async () => {
    const newProfileImage = fs.readFileSync(
      './test/testResources/chatRouter/testImage.jpg',
      {
        encoding: 'base64',
      }
    );
    const response = await request(app)
      .post(`/user/${user1._id}/image/set`)
      .set('x-access-token', getTokenForUser(user1))
      .send({ image: 'data:image/png;base64,' + newProfileImage })
      .expect('Content-Type', /json/)
      .expect(200);

    const newUser1 = await User.findById(user1._id).exec();

    expect(Buffer.from(newUser1.profileImage.data).toString()).toBe(
      newProfileImage
    );
  });
  test('Set user image invalid ID', async () => {
    const newProfileImage = fs.readFileSync(
      './test/testResources/chatRouter/testImage.jpg',
      {
        encoding: 'base64',
      }
    );
    const response = await request(app)
      .post(`/user/nonsense/image/set`)
      .set('x-access-token', getTokenForUser(user1))
      .send({ image: newProfileImage })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toBe('Invalid user ID.');
  });
  test('Set user image without permission', async () => {
    const newProfileImage = fs.readFileSync(
      './test/testResources/chatRouter/testImage.jpg',
      {
        encoding: 'base64',
      }
    );
    const response = await request(app)
      .post(`/user/${user1._id}/image/set`)
      .set('x-access-token', getTokenForUser(user2))
      .send({ image: newProfileImage })
      .expect('Content-Type', /json/)
      .expect(403);

    expect(response.body).toBe('Cannot set image for another user.');
  });
  test('Set user image invalid image', async () => {
    const response = await request(app)
      .post(`/user/${user1._id}/image/set`)
      .set('x-access-token', getTokenForUser(user1))
      .send({ image: 'nonsense' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toBe('Please provide a valid image.');
  });
  test('Set user image nonexistent ID', async () => {
    const nonexistentID = new mongoose.Types.ObjectId();
    const newProfileImage = fs.readFileSync(
      './test/testResources/chatRouter/testImage.jpg',
      {
        encoding: 'base64',
      }
    );
    const response = await request(app)
      .post(`/user/${nonexistentID}/image/set`)
      .set('x-access-token', getTokenForUser({ _id: nonexistentID }))
      .send({ image: newProfileImage })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toBe('Given user does not exist.');
  });
});

function getTokenForUser(user) {
  return jwt.sign({ user_id: user._id }, process.env.TOKEN_KEY);
}

function compareIDs(id1, id2) {
  expect(id1.toString()).toBe(id2.toString());
}
