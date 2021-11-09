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

/**
 * @api {get} /beer/:id Request a beer's information
 * @apiName GetBeer
 * @apiGroup Beer
 * @apiVersion 1.0.0
 * @apiDescription Return the beer with the id in parameter
 *
 * @apiParam {String} id Unique identifier of the beer
 *
 * @apiExample Example
 *     GET /api/v1/beer/332a234f5esa2h7212wqe3323 HTTP/1.1
 *
 * @apiSuccessExample 200 OK
 *     HTTP/1.1 200 OK
 *     Content-Type: application/json
 *       {
 *         "id": "332a234f5esa2h7212wqe3323",
 *         "name": "John",
 *         "brewery": "Doe",
 *         "alcohoLevel": "8%" 
 *       }
 */
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