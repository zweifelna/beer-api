const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for beers
const beerSchema = new Schema({
  name: String,
  breweryId: {
    type: Schema.Types.ObjectId,
    ref: 'Brewery',
    default: null,
    required: true
  },
  alcoholLevel: String,
  picture: String,
  comments: [
    {
    userId : {
      type : Schema.Types.ObjectId,
      ref : 'User',
      default : null,
      required : true
    },
    body: {
      type: String
    },
    date: {
      type: Date,
      default: Date.now,
    },
    rating :{
      type: Number,
      default: 1,
      min: 1,
      max: 5
    }
  }
],
});

// Create the model from the schema and export it
module.exports = mongoose.model('Beer', beerSchema);