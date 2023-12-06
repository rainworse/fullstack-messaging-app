const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  users: {
    type: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'User',
      },
    ],
    default: [],
  },
  messages: {
    type: [
      {
        text: String,
        from: { type: mongoose.Types.ObjectId, ref: 'User' },
        dateSent: { type: Date, default: Date.now() },
        read: { type: Boolean, default: false },
      },
    ],
    default: [],
  },
});

module.exports = mongoose.model('Chat', ChatSchema);
