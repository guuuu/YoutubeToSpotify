const { google } = require("googleapis");

const googleConfig = {
  clientId: process.env.google_id,
  clientSecret: process.env.google_secret,
  redirect: "http://127.0.0.1:8080/gl_success",
};

const defaultScope = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
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

function urlGoogle() {
  const auth = createConnection();
  const url = getConnectionUrl(auth);
  return url;
}

async function get_email(code) {
  const auth = createConnection();
  const data = await auth.getToken(code);
  const tokens = data.tokens;
  auth.setCredentials(tokens);
  
  let oauth2 = google.oauth2({
      auth: auth,
      version: 'v2'
  });
  
  console.log(oauth2.userinfo.v2.me.context.google.gmail);

  oauth2.userinfo.get((err, res) => {
    if (err) return err;
    else return res.data.email;
  });
}

module.exports.urlGoogle = urlGoogle;
module.exports.get_email = get_email;