const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for users
const userSchema = new Schema({
  firstname: String,
  lastname: String
});

// Create the model from the schema and export it
module.exports = mongoose.model('User', userSchema);