const jwt = require('jsonwebtoken');

const routeUtils = (() => {
  const verifyToken = (req, res, next) => {
    const token =
      req.body.token || req.query.token || req.headers['x-access-token'];

    if (!token) {
      return res.status(403).json('A token is required for authentication');
    }
    try {
      const decoded = jwt.verify(token, process.env.TOKEN_KEY);
      req.user = decoded;
    } catch (err) {
      return res.status(401).json('Invalid Token');
    }
    return next();
  };

  const verifyTokenWS = (token) => {
    let user;
    try {
      user = jwt.verify(token, process.env.TOKEN_KEY);
    } catch (err) {
      return res.status(401).json('Invalid Token');
    }
    return user;
  };

  function getUrlParameter(name, url) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regexS = '[\\?&]' + name + '=([^&#]*)';
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    return results == null ? null : results[1];
  }

  return { verifyToken, verifyTokenWS, getUrlParameter };
})();

module.exports = routeUtils;
