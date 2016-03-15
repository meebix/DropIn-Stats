var PARSE_ID;
var PARSE_SECRET;

if (process.env.ENV === 'production') {
  PARSE_ID = process.env.PARSE_ID;
  PARSE_SECRET = process.env.PARSE_SECRET;
} else {
  PARSE_ID = process.env.UAT_PARSE_ID;
  PARSE_SECRET = process.env.UAT_PARSE_SECRET;
}

module.exports = {
  PARSE_ID: PARSE_ID,
  PARSE_SECRET: PARSE_SECRET
};
