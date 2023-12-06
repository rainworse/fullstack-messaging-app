const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { verifyToken } = require('./routeUtils');

const User = require('../models/user');

router.get(
  '/verifyToken',
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = await User.exists({ _id: req.user.user_id }).exec();
    if (!user) {
      res.status(400).json('User not found. Most likely deleted.');
      return;
    }
    res.status(200).json('Token valid');
  })
);

router.post('/login', (req, res, next) => {
  passport.authenticate('local', function (err, user, info, status) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: 'Login Unsuccessful', info });
    }
    const token = jwt.sign({ user_id: user._id }, process.env.TOKEN_KEY);
    res.json({ message: 'Login Successful', token, id: user._id });
  })(req, res, next);
});

router.post('/user/create', [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .escape()
    .withMessage('Username must be at least 3 characters long.'),
  body('password')
    .trim()
    .isLength({ min: 3 })
    .escape()
    .withMessage('Password must be at least 3 characters long.'),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(errors.array());
      return;
    }

    let nameInUse = await User.exists({ username: req.body.username });
    if (nameInUse) {
      res.status(409).json({ message: 'Name Already In Use' });
      return;
    }

    const username = req.body.username;
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = new User({
      username: username,
      password: hashedPassword,
    });

    await user.save();

    const token = jwt.sign({ user_id: user._id }, process.env.TOKEN_KEY);
    res
      .status(200)
      .json({ message: `User ${username} Created`, token, id: user._id });
  }),
]);

module.exports = router;
