var express = require('express');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
const { param, body, query, validationResult }
    = require('express-validator');
var router = express.Router();
const Beer = require('../models/beer');
const Brewery = require('../models/brewery');
var BeerSerializer = new JSONAPISerializer('beer', {
  attributes: ['name', 'breweryId', 'alcoholLevel', 'picture'],
  pluralizeType: false
});

/**
 * @api {get} /beer List Beers
 * @apiName GetBeers
 * @apiGroup Beer
 * @apiVersion 1.0.0
 * @apiDescription Return a list of beers
 *
 * 
 * @apiSuccess (Response body) {Object[]} data List of beers data
 * @apiSuccess (Response body) {String} data.type Type of ressource
 * @apiSuccess (Response body) {String} data.id Unique identifier of the beer
 * @apiSuccess (Response body) {Object} data.attributes Beer attributes information
 * @apiSuccess (Response body) {String} data.attributes.name Name of the beer
 * @apiSuccess (Response body) {String} data.attributes.brewery-id Brewery where the beer was made
 * @apiSuccess (Response body) {Number} data.attributes.alcoholLevel Alcohol level of the beer
 * @apiSuccess (Response body) {String} data.attributes.picture Picture of the beer
 *
 * 
 * @apiExample Example
 *     GET /api/v1/beer HTTP/1.1
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
 *                "brewery-id": "asd7sads6adgx787",
 *                "alcoholLevel": "4.8"
 *                "picture": "path"
 *               },
 *              "type": "beer",
 *              "id": "883dskplxc773saj22n8882ky",
 *              "attributes": {
 *                "name": "Houleuse",
 *                "brewery-id": "oéh3jh3332ghjgfhh67ljk",
 *                "alcoholLevel": "6",
 *                "picture": "path"
 *               }
 *          ]
 *       }
 * 
 */
router.get('/',
  query('brewery_id', 'brewery_id must be alphanumeric').optional().isAlphanumeric(),
  query('brewery_id', 'brewery does not exist').optional().custom(value => {
      return Brewery.findOne({_id: value});
    }),
  query('search_name', 'search_name must be alphanumeric').optional().isAlphanumeric('en-US', {ignore: ' -'}),
  function(req, res, next) {
    try {
      validationResult(req).throw();
      let query = Beer.find();
      if(req.query.brewery_id && req.query.search_name) {
        Beer.find({breweryId: req.query.brewery_id,name: { $regex: req.query.search_name }}).exec(function(err, beer) {
            res.send(BeerSerializer.serialize(beer));
        });
      } else if(req.query.brewery_id) {
        Beer.find({breweryId: req.query.brewery_id}).exec(function(err, beer) {
            res.send(BeerSerializer.serialize(beer));
        });
      } else if(req.query.search_name) {
        Beer.find({name: { $regex: req.query.search_name }}).exec(function(err, beer) {
            res.send(BeerSerializer.serialize(beer));
        });
      } else {
        Beer.find().sort('name').exec(function(err, beer) {
          res.send(BeerSerializer.serialize(beer));
        });
      }
    } catch (err) {
      // Send the error object to the user
      res.status(400).json(err);
    }

});

/**
 * @api {get} /beer/id Request a beer's information
 * @apiName GetBeer
 * @apiGroup Beer
 * @apiVersion 1.0.0
 * @apiDescription Return the beer with the id in parameter
 *
 * @apiParam {String} id Unique identifier of the beer
 * 
 * @apiSuccess (Response body) {Object} data List of beers data
 * @apiSuccess (Response body) {String} data.type Type of ressource
 * @apiSuccess (Response body) {String} data.id Unique identifier of the beer
 * @apiSuccess (Response body) {Object} data.attributes Beer attributes information
 * @apiSuccess (Response body) {String} data.attributes.name Name of the beer
 * @apiSuccess (Response body) {String} data.attributes.brewery Brewery where the beer was made
 * @apiSuccess (Response body) {Number} data.attributes.alcoholLevel Alcohol level of the beer
 * @apiSuccess (Response body) {String} data.attributes.picture Picture of the beer
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
 *                "brewery-id": "oj7d776392sddsad92ja",
 *                "alcoholLevel": "4.8",
 *                "picture": "path"
 *               }
 *          ]
 *       }
 * 
 * @apiError {Object} 400/BadRequest Some of the beer's properties are invalid
 *
 * @apiErrorExample {json} 400 Bad Request
 *     HTTP/1.1 400 Bad Request
 *     Content-Type: application/json
 *
 *     {
 *       "errors": [
 *       {
 *         "value": "1928b5fbcd062c3a3basd^2b4cc",
 *         "msg": "id must be alphanumeric",  
 *         "param": "id",
 *         "location": "params"
 *       }
 *       ]
 *     }
 * 
 */
router.get('/:id', [
  param('id', 'id must be alphanumeric')
    .isAlphanumeric(),
], function(req, res, next) {
    Beer.findOne({_id: req.params.id}).exec(function(err, beer) {
      try {
        validationResult(req).throw();
        res.send(BeerSerializer.serialize([beer]));
      } catch (validationError) {
        // Send the error object to the user
        res.status(400).json(validationError);
      }

    });
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
 * @apiSuccess (Response body) {String} data.attributes.brewery-id Brewery where the beer was made
 * @apiSuccess (Response body) {Number} data.attributes.alcoholLevel Alcohol level of the beer
 * @apiSuccess (Response body) {String} data.attributes.picture Picture of the beer
 *
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
 *                "brewery-id": "lkasdi8739js2kjsa29",
 *                "alcoholLevel": "4.8",
 *                "picture": "path"
 *               }
 *        }
 *     }
 * 
 * @apiError {Object} 400/BadRequest Some of the beer's properties are invalid
 *
 * @apiErrorExample {json} 400 Bad Request
 *     HTTP/1.1 400 Bad Request
 *     Content-Type: application/json
 *
 *     {
 *       "errors": [
 *       {
 *         "value": "4%",
 *         "msg": "alcoholLevel must be numeric, and below 100",  
 *         "param": "alcoholLevel",
 *         "location": "body"
 *       }
 *       ]
 *     }
 * 
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
 * 
 * @apiError {Object} 400/BadRequest User does not exist
 *
 * @apiErrorExample {json} 400 Bad Request
 *     HTTP/1.1 400 Bad Request
 *     Content-Type: application/json
 *
 *     {
 *       "errors": [
 *       {
 *         "value": "61937edsad4ea55bc7a478a3aff",
 *         "msg": "user does not exist",  
 *         "param": "id",
 *         "location": "params"
 *       }
 *       ]
 *     }
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
 *                "alcoholLevel": "4.8",
 *                "picture": "path"
 *               }
 *        }
 *     }
 * 
 * @apiError {Object} 401/Unauthorized Authorization header is missing
 *
 * @apiErrorExample {json} 401 Unauthorized
 *     HTTP/1.1 401 Unauthorized
 *     Content-Type: text/html; charset=utf-8
 *
 *     Authorization header is missing
 */
router.patch('/', function (req, res) {
  Beer.findByIdAndUpdate(req.query.id, req.body, { new: true }, function (err, beer) {
    if (err){
      return next(err);
    }
    res.send(BeerSerializer.serialize(beer));
  });
});

router.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


module.exports = router;