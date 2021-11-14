const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for beers
const beerSchema = new Schema({
  name: String,
  breweryId: String,
  alcoholLevel: String,
  picture: String
});

// Create the model from the schema and export it
module.exports = mongoose.model('Beer', beerSchema);