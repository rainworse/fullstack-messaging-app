import DBHelper from '../DBHelper';

const ChatController = (() => {
  const setupChat = (chatID, setChatMessages, setChatUsers) => {
    const getChatData = async () => {
      const response = await DBHelper.makeHTTPRequest('chat/' + chatID, 'GET');
      if (response.successful) {
        setChatMessages(
          response.data.messages.reverse().map((m) => {
            m.text = m.text.replaceAll('&#x27;', "'");
            m.text = m.text.replaceAll('&quot;', '"');
            return m;
          })
        );
        const users = new Map();
        for (const user of response.data.users) {
          users.set(user._id, user);
        }
        setChatUsers(users);
      }
    };

    const getRecipient = async () => {
      const response = await DBHelper.makeHTTPRequest(
        'user/' + chatID.recipientID,
        'GET'
      );
      if (response.successful) {
        setChatMessages([]);
        const users = new Map();
        users.set(response.data._id, response.data);
        setChatUsers(users);
      }
    };

    if (chatID) {
      if (!chatID.newChat) {
        getChatData();
      } else {
        getRecipient();
      }
    }
  };

  const sendMessage = async (chatID, setSelectedChat, msg, userData) => {
    if (msg !== null && msg !== undefined && msg.length > 0) {
      if (chatID) {
        if (chatID.newChat) {
          const response = await DBHelper.makeHTTPRequest(
            'message/send',
            'POST',
            { recipient: chatID.recipientID, text: msg }
          );

          if (!response.successful) {
            console.error(response.data);
          } else {
            setSelectedChat(response.data.chatID);
            DBHelper.sendWSMessage({
              type: 'send_message',
              chatID: response.data.chatID,
              message: JSON.stringify({
                type: 'new_chat_message',
                chatID: response.data.chatID,
                message: response.data.message,
                fromUsername: userData.username,
              }),
            });
          }
        } else {
          const response = await DBHelper.makeHTTPRequest(
            `chat/${chatID}/message/send`,
            'POST',
            { text: msg }
          );
          if (!response.successful) {
            console.error(response.data);
          } else {
            DBHelper.sendWSMessage({
              type: 'send_message',
              chatID,
              message: JSON.stringify({
                type: 'message',
                chatID,
                message: response.data.message,
                fromUsername: userData.username,
              }),
            });
          }
        }
      }
    }
  };

  return { setupChat, sendMessage };
})();

export default ChatController;
