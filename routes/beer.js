var express = require('express');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
const { check, body, query, validationResult }
    = require('express-validator');
var router = express.Router();
const Beer = require('../models/beer');
var BeerSerializer = new JSONAPISerializer('beer', {
  attributes: ['name', 'brewery', 'alcoholLevel'],
  pluralizeType: false
});

/* GET beers listing. */
router.get('/',[
  query('id', 'id must be alphanumeric')
    .isAlphanumeric(),
], function(req, res, next) {

  if(req.query.id) {
    Beer.findOne({_id: req.query.id}).exec(function(err, beer) {
      try {
        validationResult(req).throw();
        res.send(BeerSerializer.serialize([beer]));
      } catch (validationError) {
        // Send the error object to the user
        res.status(400).json(validationError);
      }

    });
  } else {
    Beer.find().sort('name').exec(function(err, beer) {
      res.send(BeerSerializer.serialize(beer));
    });
  }

});

// /* GET beers listing. */
// router.get('/', function(req, res, next) {
//     res.send('respond with a beer resource');
//   });

module.exports = router;