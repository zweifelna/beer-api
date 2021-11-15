const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for breweries
const brewerySchema = new Schema({
  name: String,
  owner: String,
  location: String
});



// Create the model from the schema and export it
module.exports = mongoose.model('Brewery', brewerySchema);