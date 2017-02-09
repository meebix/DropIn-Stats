// ENV environment variable gets set inline in bash jobs

var ENV;
var PARSE_ID;
var SERVER_URL;

if (process.env.ENV === 'production') {
  ENV = process.env.ENV;
  PARSE_ID = process.env.PARSE_ID;
  SERVER_URL = process.env.SERVER_URL;
} else {
  ENV = process.env.ENV;
  PARSE_ID = process.env.UAT_PARSE_ID;
  SERVER_URL = process.env.UAT_SERVER_URL;
}

module.exports = {
  ENV: ENV,
  PARSE_ID: PARSE_ID,
  SERVER_URL: SERVER_URL
};
