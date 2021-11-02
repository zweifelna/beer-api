const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for comments
const commentSchema = new Schema({
  content: String,
  rating: String,
  beerID: int
});

// Create the model from the schema and export it
module.exports = mongoose.model('comment', commentSchema);