// Load environment variables from the .env file.
try {
    require('dotenv').config({ path: '.env' })
  } catch (err) {
    console.log('No .env file loaded');
  }

  // Retrieve configuration from environment variables.
exports.port = process.env.PORT || 3000;