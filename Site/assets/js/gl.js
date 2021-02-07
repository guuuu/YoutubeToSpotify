const { google } = require("googleapis");
const googleConfig = {
  clientId: process.env.google_id,
  clientSecret: process.env.google_secret,
  redirect: "http://127.0.0.1:8080/gl_success",
};
const defaultScope = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/youtube.readonly'
];
let google_client_email = null;

function createConnection() {
  return new google.auth.OAuth2(
    googleConfig.clientId,
    googleConfig.clientSecret,
    googleConfig.redirect
  );
}

function getConnectionUrl(auth) {
  return auth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: defaultScope
  });
}

function urlGoogle() {
  const auth = createConnection();
  const url = getConnectionUrl(auth);
  return url;
}

function access_tokens(code) {
  var postDataUrl = 'https://www.googleapis.com/oauth2/v3/token?' +
    'code=' + code +
    '&client_id=' + googleConfig.clientId +
    '&client_secret=' + googleConfig.clientSecret +
    '&redirect_uri=' + "http://127.0.0.1:8080/gl_success" +
    '&grant_type=' + "authorization_code"

  var options = {
    uri: postDataUrl,
    method: 'POST'
  };

  return options;
}

module.exports.urlGoogle = urlGoogle;
module.exports.tokens = access_tokens;