const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const { default: mongoose } = require('mongoose');
const { verifyToken } = require('./routeUtils');

const Chat = require('../models/Chat');
const User = require('../models/user');
const routeUtils = require('./routeUtils');

/**
 * Get username and photo by user id
 */
router.get(
  '/user/:id',
  asyncHandler(async (req, res) => {
    if (!checkIdIsValid(req.params.id)) {
      res.status(400).json('User ID is not valid.');
      return;
    }

    const user = await getUserById(req.params.id, res);
    if (!user) return;

    res.json(user);
  })
);

router.get(
  '/search/:query',
  asyncHandler(async (req, res) => {
    if (!req.params.query || req.params.query.length === 0) {
      res.status(400).json('Search query cannot be empty.');
    }
    const queryExp = new RegExp(req.params.query, 'i');
    const results = await User.find({
      username: queryExp,
    })
      .select({ username: 1, profileImage: 1 })
      .exec();
    res.status(200).json(
      results.map((u) => {
        return {
          id: u._id,
          username: u.username,
          profileImage: Buffer.from(u.profileImage.data).toString(),
        };
      })
    );
  })
);

/**
 * Get chats for user
 */
router.get('/user/:id/chats', verifyToken, async (req, res) => {
  if (!checkIdIsValid(req.params.id)) {
    res.status(400).json('User ID is not valid.');
    return;
  }

  if (req.params.id !== req.user.user_id) {
    res.status(403).json('Cannot get chats of another user.');
    return;
  }

  const userChats = await getUserChats(req.user.user_id, res);

  res.status(200).json(userChats);
});

const chatConnections = new Map();
const chatUserIDs = new Map();
const userIDToWSMap = new Map();
const wsToUserIDMap = new Map();

/**
 * Socket communication for chat
 */
router.ws(
  '/chat/:id',
  asyncHandler(async (ws, req) => {
    const chatID = req.params.id;
    ws.on('message', function (msg) {
      const connectionsToChat = chatConnections.get(chatID);
      if (connectionsToChat) {
        for (const connection of connectionsToChat) {
          connection.send(msg);
        }
      }
      const chatUserIds = chatUserIDs.get(chatID);
      for (const chatUser of chatUserIds) {
        const userConnection = userIDToWSMap.get(chatUser);
        if (userConnection) {
          userConnection.send({ chatID, msg });
        }
      }
    });
    ws.on('close', function () {
      const connectionsToChat = chatConnections.get(chatID);
      if (connectionsToChat) {
        connectionsToChat.delete(ws);
      }
      if (connectionsToChat.length == 0) {
        chatConnections.delete(chatID);
      } else {
        chatConnections.set(chatID, connectionsToChat);
      }
    });

    const token = routeUtils.getUrlParameter('token', req.url);
    const user = routeUtils.verifyTokenWS(token);
    const chat = await Chat.findById(chatID).exec();
    const chatUsers = chat.users.map((u) => u._id.toString());
    if (chatUsers.includes(user.user_id)) {
      let connectionsToChat = chatConnections.get(chatID);
      if (!connectionsToChat) connectionsToChat = new Set();
      connectionsToChat.add(ws);
      chatConnections.set(chatID, connectionsToChat);
      chatUserIDs.set(chatID, chatUsers);
    }
  })
);

/**
 * Socket communication for chat lists
 */
router.ws(
  '/chatupdates',
  asyncHandler(async (ws, req) => {
    ws.on('close', function () {
      const userID = wsToUserIDMap.get(ws);
      userIDToWSMap.delete(userID);
      wsToUserIDMap.delete(ws);
    });

    const token = routeUtils.getUrlParameter('token', req.url);
    const user = routeUtils.verifyTokenWS(token);

    userIDToWSMap.set(user.user_id, ws);
    wsToUserIDMap.set(ws, user.user_id);
  })
);

/**
 * Get chat by ID
 */
router.get(
  '/chat/:id',
  verifyToken,
  asyncHandler(async (req, res) => {
    if (!checkIdIsValid(req.params.id)) {
      res.status(400).json('Chat ID is not valid.');
      return;
    }
    const chat = await getChatById(req.params.id, res);
    if (!chat) return;

    if (!checkUserIsInChat(req.user.user_id, chat)) {
      res.status(403).json('You do not have permissions to access this chat.');
      return;
    }

    res.json(chat);
  })
);

/**
 * Get chat by recipient ID
 *
 * Only returns direct messages, ignores group chats
 */
router.get(
  '/chat/user/:id',
  verifyToken,
  asyncHandler(async (req, res) => {
    if (!checkIdIsValid(req.params.id)) {
      res.status(400).json('Recipient ID is not valid.');
      return;
    }

    if (req.params.id === req.user.user_id) {
      res.status(501).json('Not yet available.');
      return;
    }

    const user = await getUserById(req.user.user_id, res, ['chats']);
    if (!user) return;
    let chat = await getChatWithUser(user.chats, req.params.id);

    if (chat === undefined || chat === null) {
      const recipient = await getUserById(req.params.id, res, ['chats']);
      if (!recipient) return;
      chat = await getChatWithUser(recipient.chats, req.user.user_id);

      if (chat === undefined || chat === null) {
        res.status(404).json('Chat not found.');
        return;
      } else {
        await User.findByIdAndUpdate(user._id, { $push: { chats: chat } });
      }
    }

    res.json(await getChatResponseData(chat));
  })
);

/**
 * Send message to chat by chat ID
 */
router.post('/chat/:id/message/send', verifyToken, [
  body('text')
    .trim()
    .notEmpty()
    .escape()
    .withMessage('Message must not be empty.'),
  asyncHandler(async (req, res) => {
    if (!checkIdIsValid(req.params.id)) {
      res.status(400).json('Chat ID is not valid.');
      return;
    }
    if (checkForValidationErrors(req, res)) return;
    const chat = await getChatById(req.params.id, res);
    if (!chat) return;
    if (!checkUserIsInChat(req.user.user_id, chat)) {
      res.status(403).json('You do not have permissions to access this chat.');
      return;
    }
    const message = {
      text: req.body.text,
      from: req.user.user_id,
      read: false,
    };
    await Chat.findByIdAndUpdate(chat._id, {
      $push: { messages: { $each: [message], $position: 0 } },
    });
    res.status(200).json('Message sent.');
  }),
]);

/**
 * Send message by recipient ID
 */
router.post('/message/send', verifyToken, [
  body('recipient').custom(async (value) => {
    if (!checkIdIsValid(value)) throw new Error('Recipient ID is not valid.');
  }),
  body('text')
    .trim()
    .notEmpty()
    .escape()
    .withMessage('Message must not be empty.'),
  asyncHandler(async (req, res) => {
    if (checkForValidationErrors(req, res)) return;

    const sender = await getUserById(req.user.user_id, res, ['chats']);
    const recipient = await getUserById(req.body.recipient, res, ['chats']);
    if (!sender || !recipient) return;

    let chat = await getChatWithUser(sender.chats, recipient._id);
    if (chat === undefined)
      chat = await getChatWithUser(recipient.chats, sender._id);
    if (chat === undefined)
      chat = await createNewChatBetweenUsers(sender, recipient);

    const message = { text: req.body.text, from: sender._id, read: false };
    await Chat.findByIdAndUpdate(chat._id, {
      $push: { messages: { $each: [message], $position: 0 } },
    });

    res.json({ message: 'Message sent.', chatID: chat._id });
  }),
]);

/**
 * Delete message from chat by ID
 */
router.post(
  '/chat/:chatId/message/:msgId/delete',
  verifyToken,
  asyncHandler(async (req, res) => {
    if (!checkIdIsValid(req.params.chatId)) {
      res.status(400).json('Chat ID is not valid.');
      return;
    }
    if (!checkIdIsValid(req.params.msgId)) {
      res.status(400).json('Message ID is not valid.');
      return;
    }

    const chat = await getChatById(req.params.chatId, res);
    if (!chat) return;
    const message = chat.messages.find(
      (m) => req.params.msgId == m._id.toString()
    );
    if (!message) {
      res
        .status(400)
        .json(
          `Message with ID ${req.params.msgId} in chat with ID ${req.params.chatId} not found.`
        );
    }
    if (!message.from.equals(req.user.user_id)) {
      res.status(400).json('Cannot delete message sent by another user');
    }

    await Chat.findByIdAndUpdate(chat._id, { $pull: { messages: message } });
    res.status(200).json('Message deleted');
  })
);

/**
 * Add user to chat
 */
router.post('/chat/:id/user/add', verifyToken, [
  body('newUserID').exists(),
  asyncHandler(async (req, res) => {
    if (checkForValidationErrors(req, res)) return;
    if (!checkIdIsValid(req.body.newUserID)) {
      res.status(400).json('Invalid user ID.');
      return;
    }
    if (!checkIdIsValid(req.params.id)) {
      res.status(400).json('Invalid chat ID.');
      return;
    }

    const chat = await getChatById(req.params.id, res);
    if (!chat) return;
    const addingUser = await getUserById(req.user.user_id, res);
    if (!addingUser) return;
    const userToAdd = await getUserById(req.body.newUserID, res);
    if (!userToAdd) return;

    if (!checkUserIsInChat(addingUser._id, chat)) {
      res
        .status(403)
        .json(
          'You are not allowed to add members to this chat as you are not a member.'
        );
      return;
    }

    if (checkUserIsInChat(userToAdd._id, chat)) {
      res
        .status(409)
        .json(`User ${userToAdd.username} is already a member of this chat.`);
      return;
    }

    await Chat.findByIdAndUpdate(chat._id, { $push: { users: userToAdd } });
    res.status(200).json(`User ${userToAdd.username} added successfully.`);
  }),
]);

/**
 * Remove user from chat
 */
router.post('/chat/:id/user/remove', verifyToken, [
  body('removeUserID').exists(),
  asyncHandler(async (req, res) => {
    if (checkForValidationErrors(req, res)) return;
    if (!checkIdIsValid(req.body.removeUserID)) {
      res.status(400).json('Invalid user ID.');
      return;
    }
    if (!checkIdIsValid(req.params.id)) {
      res.status(400).json('Invalid chat ID.');
      return;
    }

    const chat = await getChatById(req.params.id, res);
    if (!chat) return;
    const addingUser = await getUserById(req.user.user_id, res);
    if (!addingUser) return;
    const userToRemove = await getUserById(req.body.removeUserID, res);
    if (!userToRemove) return;

    if (!checkUserIsInChat(addingUser._id, chat)) {
      res
        .status(403)
        .json(
          'You are not allowed to remove members from this chat as you are not a member.'
        );
      return;
    }

    if (!checkUserIsInChat(userToRemove._id, chat)) {
      res
        .status(409)
        .json(`User ${userToRemove.username} is not a member of this chat.`);
      return;
    }

    await Chat.findByIdAndUpdate(chat._id, {
      $pull: { users: userToRemove._id },
    });
    res.status(200).json(`User ${userToRemove.username} removed from chat.`);
  }),
]);

const checkIdIsValid = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const checkForValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(errors.array().map((e) => e.msg));
    return true;
  }
  return false;
};

const getUserById = async (id, res, populateFields) => {
  let user;
  if (populateFields) {
    user = await User.findById(id).populate(populateFields).exec();
  } else {
    user = await User.findById(id).exec();
  }

  if (user === null || user === undefined) {
    res.status(400).json(`User with id ${id} does not exist`);
    return;
  }

  const returnData = {
    _id: user._id,
    username: user.username,
    profileImage: Buffer.from(user.profileImage.data).toString(),
  };

  if (populateFields) {
    populateFields.forEach((field) => {
      returnData[field] = user[field];
    });
  }

  return returnData;
};

const getUserChats = async (id, res) => {
  const user = await User.findById(id).populate('chats').exec();

  if (user === null || user === undefined) {
    res.status(400).json(`User with id ${id} does not exist.`);
    return;
  }

  const returnData = [];
  for (const chat of user.chats) {
    let chatUsers = chat.users.filter((u) => u.toString() !== id);
    let lastMessageUser = null;
    let chatIcon = null;
    let chatName = null;
    if (chat.messages.length > 0) {
      lastMessageUser = await getUserById(chat.messages[0].from, res);
      if (chat.messages[0].from.toString() !== id) {
        chatIcon = lastMessageUser.profileImage;
        chatName = lastMessageUser.username;
      } else {
        const otherUser = await getUserById(chatUsers[0], res);
        chatIcon = otherUser.profileImage;
        chatName = otherUser.username;
      }
    } else {
      const otherUser = await getUserById(chatUsers[0], res);
      chatIcon = otherUser.profileImage;
      chatName = otherUser.username;
    }

    const chatData = {
      id: chat._id,
      chatName,
      users: chatUsers,
      lastMessage: chat.messages[0],
      lastMessageUser,
      chatIcon,
    };
    returnData.push(chatData);
  }

  return returnData;
};

const getChatById = async (id, res) => {
  const chat = await Chat.findById(id).exec();
  if (chat === null || chat === undefined) {
    res.status(400).json('Chat does not exist.');
    return;
  }

  return await getChatResponseData(chat, res);
};

const getChatWithUser = async (chats, otherUserId) => {
  return chats.find((c) => {
    return c.users.length === 2 && c.users.includes(otherUserId);
  });
};

const checkUserIsInChat = (user, chat) => {
  return chat.users.find((u) => u._id.equals(user));
};

const createNewChatBetweenUsers = async (user1, user2) => {
  const chat = new Chat({ users: [user1, user2] });
  await chat.save();
  await User.findByIdAndUpdate(user1._id, { $push: { chats: chat } });
  await User.findByIdAndUpdate(user2._id, { $push: { chats: chat } });
  return chat;
};

const getChatResponseData = async (chat, res) => {
  const response = {
    _id: chat._id,
    users: [],
    messages: chat.messages,
  };
  for (const user of chat.users) {
    response.users.push(await getUserById(user, res));
  }

  return response;
};

module.exports = router;
