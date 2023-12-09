const DBHelper = (() => {
  const url = 'http://localhost:3000/';
  let token = null;

  const setToken = (userToken) => {
    token = userToken;
  };

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

  let wsConnection = null;
  const wsListeners = new Map();

  const addWSEventListener = (key, listener) => {
    wsListeners.set(key, listener);
  };

  const createWSConnection = () => {
    if (wsConnection) {
      wsConnection.close();
    }
    wsConnection = new WebSocket('ws://localhost:3000/connect/' + token);
    wsConnection.addEventListener('message', (event) => {
      for (const listener of wsListeners.values()) {
        listener(event.data);
      }
    });
  };

  const closeWSConnection = () => {
    if (wsConnection) {
      wsConnection.close();
    }
  };

  const sendWSMessage = (msg) => {
    if (wsConnection) {
      wsConnection.send(JSON.stringify(msg));
    }
  };

  return {
    setToken,
    makeHTTPRequest,
    addWSEventListener,
    createWSConnection,
    closeWSConnection,
    sendWSMessage,
  };
})();

export default DBHelper;
