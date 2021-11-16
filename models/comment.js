const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for comments
const commentSchema = new Schema({
  body:{
  type: String,
  required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
});

// Create the model from the schema and export it
module.exports = mongoose.model('comment', commentSchema);
