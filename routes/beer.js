var express = require('express');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
const { check, body, query, validationResult }
    = require('express-validator');
var router = express.Router();
const Beer = require('../models/beer');
const Brewery = require('../models/brewery');
var BeerSerializer = new JSONAPISerializer('beer', {
  attributes: ['name', 'breweryId', 'alcoholLevel', 'picture'],
  pluralizeType: false
});

/**
 * @api {get} /beer/id Request a beer's information
 * @apiName GetBeer
 * @apiGroup Beer
 * @apiVersion 1.0.0
 * @apiDescription Return the beer with the id in parameter
 *
 * @apiParam {String} [id] Unique identifier of the beer
 * 
 * @apiSuccess (Response body) {Object[]} data List of beers data
 * @apiSuccess (Response body) {String} data.type Type of ressource
 * @apiSuccess (Response body) {String} data.id Unique identifier of the beer
 * @apiSuccess (Response body) {Object} data.attributes Beer attributes information
 * @apiSuccess (Response body) {String} data.attributes.name Name of the beer
 * @apiSuccess (Response body) {String} data.attributes.brewery Brewery where the beer was made
 * @apiSuccess (Response body) {Number} data.attributes.alcoholLevel Alcohol level of the beer
 *
 * @apiExample Example
 *     GET /api/v1/beer/332a234f5esa2h7212wqe3323 HTTP/1.1
 *
 * @apiSuccessExample 200 OK
 *     HTTP/1.1 200 OK
 *     Content-Type: application/json
 *       {
 *          "data": [
 *              "type": "beer",
 *              "id": "332a234f5esa2h7212wqe3323",
 *              "attributes": {
 *                "name": "Swaf",
 *                "brewery": "Docteur Gab's",
 *                "alcoholLevel": "4.8%"
 *               }
 *          ]
 *       }
 */
router.get('/',[
  query('id', 'id must be alphanumeric')
    .isAlphanumeric(),
  body('breweryId').custom((value, {req}) => {
    if (value !== Brewery.findOne({_id: value}));
  })
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

/**
 * @api {post} /api/v1/beer Create a beer
 * @apiName CreateBeer
 * @apiGroup Beer
 * @apiVersion 1.0.0
 * @apiDescription Registers a new beer.
 *
 * @apiSuccess (Response body) {Object} data Beer data information
 * @apiSuccess (Response body) {String} data.id Unique identifier of the beer
 * @apiSuccess (Response body) {String} data.type Type of ressource
 * @apiSuccess (Response body) {Object} data.attributes Beer attributes information
 * @apiSuccess (Response body) {String} data.attributes.name Name of the beer
 * @apiSuccess (Response body) {String} data.attributes.brewery Brewery where the beer was made
 * @apiSuccess (Response body) {Number} data.attributes.alcoholLevel Alcohol level of the beer
 *
 * @apiExample Example
 *     POST /api/v1/beer HTTP/1.1
 *     Content-Type: application/json
 *
 *     {
 *       "name": "Swaf",
 *       "brewery": "Docteur Gab's",
 *       "alcoholLevel": "4.8"
 *     }
 *
 * @apiSuccessExample 201 Created
 *     HTTP/1.1 201 Created
 *     Content-Type: application/json
 *
 *     {
 *       "data": {
 *              "type": "beer",
 *              "id": "332a234f5esa2h7212wqe3323",
 *              "attributes": {
 *                "name": "Swaf",
 *                "brewery": "Docteur Gab's",
 *                "alcoholLevel": "4.8"
 *               }
 *        }
 *     }
 */
router.post('/',[
  body('name', 'name can\'t be empty')
    .not().isEmpty(),
  body('breweryId', 'breweryId can\'t be empty')
    .not().isEmpty(),
  body('alcoholLevel', 'alcoholLevel must be numeric, and below 100')
    .isInt({max: 100 }),
  body('picture', 'picture can\'t be empty')
  .not().isEmpty(),
], function(req, res, next) {
  try {
    validationResult(req).throw();

    // Create a new document from the JSON in the request body
    const newBeer = new Beer(req.body);

    // Save that document
    newBeer.save(function(err, savedBeer) {
      if (err) {
        return next(err);
      }
      // Send the saved document in the response
      res.send(BeerSerializer.serialize(savedBeer));
    });
  } catch (err) {
    // Send the error object to the user
    res.status(400).json(err);
  }
});

/**
 * @api {delete} /api/v1/beer/id Delete a beer
 * @apiName DeleteBeer
 * @apiGroup Beer
 * @apiVersion 1.0.0
 * @apiDescription Permanently deletes a beer.
 *
 * @apiExample Example
 *     DELETE /api/v1/beer/332a234f5esa2h7212wqe3323 HTTP/1.1
 *
 * @apiSuccessExample 204 No Content
 *     HTTP/1.1 204 No Content
 */
router.delete('/', function (req, res) {
  Beer.deleteOne({ id: req.query.id }, function (err) {
    if (err) {
      return next(err);
    }
    res.sendStatus(200);
  });
});

/**
 * @api {patch} /api/v1/beer/id Partially update a beer
 * @apiName PartiallyUpdateBeer
 * @apiGroup Beer
 * @apiVersion 1.0.0
 * @apiDescription Partially updates a beer's data (only the properties found in the request body will be updated).
 * All properties are optional.
 *
 * @apiExample Example
 *     PATCH /api/v1/beer/332a234f5esa2h7212wqe3323 HTTP/1.1
 *     Content-Type: application/json
 *
 *     {
 *       "name": "Houleuse"
 *     }
 *
 * @apiSuccessExample 200 OK
 *     HTTP/1.1 200 OK
 *     Content-Type: application/json
 *
 *     {
 *       "data": {
 *              "type": "beer",
 *              "id": "332a234f5esa2h7212wqe3323",
 *              "attributes": {
 *                "name": "Houleuse",
 *                "brewery": "Docteur Gab's",
 *                "alcoholLevel": "4.8"
 *               }
 *        }
 *     }
 */
router.patch('/', function (req, res) {
  Beer.findByIdAndUpdate(req.query.id, req.body, { new: true }, function (err, beer) {
    if (err){
      return next(err);
    }
    res.send(BeerSerializer.serialize(beer));
  });
});

module.exports = router;