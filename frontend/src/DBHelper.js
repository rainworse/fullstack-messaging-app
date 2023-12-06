const DBHelper = (() => {
  const url = 'http://localhost:3000/';
  let token = null;

  const setToken = (userToken) => {
    token = userToken;
  };

  let chatSocket = null;
  let chatListSocket = null;

  const makeHTTPRequest = async (path, method, body) => {
    let response = await fetch(url + path, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    const successful = response.status >= 200 && response.status <= 399;
    const data = await response.json();

    return { successful, data };
  };

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['x-access-token'] = token;
    }
    return headers;
  };

  const createChatConnection = (chatID, listeners) => {
    if (chatSocket) {
      chatSocket.close();
    }
    chatSocket = new WebSocket(
      'ws://localhost:3000/chat/' + chatID + '?token=' + token
    );
    for (const listener of listeners) {
      chatSocket.addEventListener(listener.event, listener.handler);
    }
  };

  const createChatListConnection = (listeners) => {
    if (chatListSocket) {
      chatListSocket.close();
    }
    chatListSocket = new WebSocket(
      'ws://localhost:3000/chatupdates' + '?token=' + token
    );
    for (const listener of listeners) {
      chatListSocket.addEventListener(listener.event, listener.handler);
    }
  };

  const sendMessageToChatSocket = (data) => {
    if (chatSocket) {
      chatSocket.send(JSON.stringify(data));
    }
  };

  const closeChatConnection = () => {
    if (chatSocket) chatSocket.close();
  };

  const closeChatListConnection = () => {
    if (chatListSocket) chatListSocket.close();
  };

  return {
    setToken,
    makeHTTPRequest,
    createChatConnection,
    sendMessageToChatSocket,
    closeChatConnection,
    createChatListConnection,
    closeChatListConnection,
  };
})();

export default DBHelper;
