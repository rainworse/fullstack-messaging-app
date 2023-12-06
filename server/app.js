const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./initDB');
require('./initPassport');
const bodyParser = require('body-parser');

const session = require('express-session');
const passport = require('passport');

const app = express();
var expressWs = require('express-ws')(app);

const indexRouter = require('./routes/index');
const chatRouter = require('./routes/chat');
const errorHandlers = require('./routes/error');

app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
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
app.use(errorHandlers.catch);
app.use(errorHandlers.handle);

app.listen(3000, () => {
  console.log('Started on port 3000');
});

module.exports = app;
