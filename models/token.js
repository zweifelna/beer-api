const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for beers
const tokenSchema = new Schema({
  token_value: String,
});

// Create the model from the schema and export it
module.exports = mongoose.model('SecretToken', tokenSchema);