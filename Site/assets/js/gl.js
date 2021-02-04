const { google } = require("googleapis");

const googleConfig = {
  clientId: process.env.google_id,
  clientSecret: process.env.google_secret,
  redirect: "http://127.0.0.1:8080/gl_success",
};

const defaultScope = [
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/userinfo.email',
];

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

function getGooglePlusApi(auth) {
  return google.plus({
    version: 'v1',
    auth
  });
}

module.exports = {
  urlGoogle: () => {
    const auth = createConnection();
    const url = getConnectionUrl(auth);
    return url;
  },

  getGoogleAccountFromCode: async (code) => {
    const auth = createConnection();
    const data = await auth.getToken(code);
    const tokens = data.tokens;
    auth.setCredentials(tokens);
    const plus = getGooglePlusApi(auth);
    const me = await plus.people.get({
      userId: 'me'
    });
    const userGoogleId = me.data.id;
    const userGoogleEmail = me.data.emails && me.data.emails.length && me.data.emails[0].value;
    return {
      id: userGoogleId,
      email: userGoogleEmail,
      tokens: tokens,
    };
  }
}