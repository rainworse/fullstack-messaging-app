const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const fs = require('fs');

const defaultProfileImage = fs.readFileSync('./assets/defaultProfile1.png', {
  encoding: 'base64',
});

const UserSchema = new Schema({
  username: String,
  password: String,
  chats: {
    type: [{ type: mongoose.Types.ObjectId, ref: 'Chat' }],
    default: [],
  },
  profileImage: {
    type: { data: Buffer, contentType: String },
    default: { data: defaultProfileImage, contentType: 'image/jpg' },
  },
});

module.exports = mongoose.model('User', UserSchema);
