// Load environment variables from the .env file.
try {
    require('dotenv').config({ path: '.env' })
  } catch (err) {
    console.log('No .env file loaded');
  }

// Retrieve configuration from environment variables.
exports.port = process.env.PORT || 27017;
exports.secretKey = process.env.SECRET_KEY || 'changeme';
exports.url_prefix = process.env.URL_PREFIX;
exports.database_server = process.env.DATABASE_SERVER || process.env.DATABASE_URL;
exports.database_name = process.env.DATABASE_NAME;