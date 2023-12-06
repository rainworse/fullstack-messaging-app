import DBHelper from '../DBHelper';

const ChatController = (() => {
  const setupChat = (chatID, setChatMessages, setChatUsers, socketHandlers) => {
    const getChatData = async () => {
      const response = await DBHelper.makeHTTPRequest('chat/' + chatID, 'GET');
      if (response.successful) {
        setChatMessages(response.data.messages.reverse());
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
        initWebsocket(chatID, socketHandlers);
      } else {
        getRecipient();
      }
    }
  };

  const initWebsocket = (chatID, socketHandlers) => {
    DBHelper.createChatConnection(chatID, socketHandlers);
  };

  const sendMessage = async (chatID, setSelectedChat, userID, msg) => {
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
            DBHelper.sendMessageToChatSocket({ from: userID, text: msg });
          }
        }
      }
    }
  };

  return { setupChat, sendMessage };
})();

export default ChatController;
