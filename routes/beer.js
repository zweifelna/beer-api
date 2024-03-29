var express = require('express');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
const { param, body, query, validationResult }
    = require('express-validator');
var router = express.Router();
const Beer = require('../models/beer');
const Brewery = require('../models/brewery');
const {authenticate} = require('./auth');
var BeerSerializer = new JSONAPISerializer('beer', {
  attributes: ['name', 'breweryId', 'alcoholLevel', 'picture', 'comments'],
  pluralizeType: false
});
const { broadcastMessage } = require('../ws');

/**
 * @api {get} /beer List Beers
 * @apiName GetBeers
 * @apiGroup Beer
 * @apiDescription Return a list of beers
 * 
 * @apiHeader {Number} Pagination-Page Actual page in the paginated list
 * @apiHeader {Number} Pagination-PageSize Number of beers on the page
 * @apiHeader {Number} Pagination-Total Total of beers
 *
 * @apiParam {String} [search_name]       Optional name of the beer
 * @apiParam {String} [brewery_id]        Optional id of the brewery
 * @apiParam {String} [page]              Optional page number of the paginated beer list
 * @apiParam {String} [pageSize]          Optional number of beer per page
 * 
 * @apiSuccess (Response body) {Object[]} data List of beers data
 * @apiSuccess (Response body) {String} data.type Type of ressource
 * @apiSuccess (Response body) {String} data.id Unique identifier of the beer
 * @apiSuccess (Response body) {Object} data.attributes Beer attributes information
 * @apiSuccess (Response body) {String} data.attributes.name Name of the beer
 * @apiSuccess (Response body) {String} data.attributes.brewery-id Reference to the brewery
 * @apiSuccess (Response body) {Number} data.attributes.alcoholLevel Alcohol level of the beer
 * @apiSuccess (Response body) {String} data.attributes.picture Picture of the beer
 * @apiSuccess (Response body) {Object[]} data.attributes.comments List of comments
 * @apiSuccess (Response body) {String} data.attributes.comments.userId Reference to the author user
 * @apiSuccess (Response body) {String} data.attributes.comments.body Content of the comment
 * @apiSuccess (Response body) {Date} data.attributes.comments.date Date when the comment was posted
 * @apiSuccess (Response body) {Number} data.attributes.comments.rating Rating of the beer
 * 
 * @apiExample Basic Example
 *     GET /api/v1/beer HTTP/1.1
 * @apiExample Example With Parameters
 *     GET /api/v1/beer?search_name=DrGab&brewery_id=61928ac4880d475be35509a7 HTTP/1.1
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
 *                "picture": "path",
 *                "comments": [
 *                  {
 *                    "userId": "619107e1805f1f900c8587e5",
 *                    "body": "C'est pas mal, mais ça manque de gras",
 *                    "rating": 4,
 *                    "_id": "6193fa3ebf7ab30717cde86c",
 *                    "date": "2021-11-16T18:36:46.578Z"
 *                  }
 *                ] 
 *               },
 *              "type": "beer",
 *              "id": "883dskplxc773saj22n8882ky",
 *              "attributes": {
 *                "name": "Houleuse",
 *                "breweryId": "oéh3jh3332ghjgfhh67ljk",
 *                "alcoholLevel": "6",
 *                "picture": "path",
 *                "comments": []
 *               }
 *          ]
 *       }
 * 
 */
router.get('/', authenticate,
  query('brewery_id', 'brewery_id must be alphanumeric').optional().isAlphanumeric(),
  query('brewery_id', 'brewery does not exist').optional().custom(value => {
      return Brewery.findOne({_id: value});
    }),
  query('search_name', 'search_name must be alphanumeric').optional().isAlphanumeric('en-US', {ignore: ' -'}),
  function(req, res, next) {

    try {
      validationResult(req).throw();
      Beer.find().count(function(err, total) {
        if (err) { return next(err); };
        let query = Beer.find();
  
        // Parse the "page" param (default to 1 if invalid)
        let page = parseInt(req.query.page, 10);
        if (isNaN(page) || page < 1)
          page = 1;
  
        // Parse the "pageSize" param (default to 100 if invalid)
        let pageSize = parseInt(req.query.pageSize, 10);
        if (isNaN(pageSize) || pageSize < 0 || pageSize > 100)
          pageSize = 100;
  
        // Apply skip and limit to select the correct page of elements
        query = query.skip((page - 1) * pageSize).limit(pageSize);
        res.setHeader('Pagination-Page', page);
        res.setHeader('Pagination-PageSize', pageSize);
        res.setHeader('Pagination-Total', total);
        
        if(req.query.brewery_id && req.query.search_name) {
          query.where({breweryId: req.query.brewery_id,name: { $regex: req.query.search_name }}).exec(function(err, beer) {
              res.send(BeerSerializer.serialize(beer));
          });
        } else if(req.query.brewery_id) {
          query.where({breweryId: req.query.brewery_id}).exec(function(err, beer) {
              res.send(BeerSerializer.serialize(beer));
          });
        } else if(req.query.search_name) {
          query.where({name: { $regex: req.query.search_name }}).exec(function(err, beer) {
              res.send(BeerSerializer.serialize(beer));
          });
        } else {
          query.sort('name').exec(function(err, beer) {
            res.send(BeerSerializer.serialize(beer));
          });
        }
      });
    } catch (err) {
      // Send the error object to the user
      res.status(400).json(err);
    }

});

/**
 * @api {get} /beer/:id Request a beer's information
 * @apiName GetBeer
 * @apiGroup Beer
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
 * @apiSuccess (Response body) {Object[]} data.attributes.comments List of comments
 * @apiSuccess (Response body) {String} data.attributes.comments.userId Reference to the author user
 * @apiSuccess (Response body) {String} data.attributes.comments.body Content of the comment
 * @apiSuccess (Response body) {Date} data.attributes.comments.date Date when the comment was posted
 * @apiSuccess (Response body) {Number} data.attributes.comments.rating Rating of the beer
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
 *                "picture": "path",
 *                "comments": [
 *                  {
 *                    "userId": "619107e1805f1f900c8587e5",
 *                    "body": "C'est pas mal, mais ça manque de gras",
 *                    "rating": 4,
 *                    "_id": "6193fa3ebf7ab30717cde86c",
 *                    "date": "2021-11-16T18:36:46.578Z"
 *                  }
 *                ]
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
 * @apiError {Object} 401/Unauthorized Authorization header is missing
 *
 * @apiErrorExample {json} 401 Unauthorized
 *     HTTP/1.1 401 Unauthorized
 *     Content-Type: text/html; charset=utf-8
 *
 *     Authorization header is missing
 * 
 */
router.get('/:id', authenticate, [
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
 * @api {get} /beer/:id/rating Request a beer's rating average
 * @apiName GetRating
 * @apiGroup Beer
 * @apiDescription Return the average of rating of the beer with the id in parameter
 *
 * @apiParam {String} id Unique identifier of the beer
 * 
 * @apiSuccess (Response body) {Object} data List of beers data
 * @apiSuccess (Response body) {String} data.type Type of ressource
 * @apiSuccess (Response body) {String} data.id Unique identifier of the beer
 * @apiSuccess (Response body) {Object} data.attributes Beer attributes information
 * @apiSuccess (Response body) {String} data.attributes._id Name of the beer
 * @apiSuccess (Response body) {String} data.attributes.rating Average of the rating
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
 *                "_id": "Swaf",
 *                "rating": 4.666666666666667
 *               }
 *          ]
 *       }
 * 
 * 
 * @apiError {Object} 401/Unauthorized Authorization header is missing
 *
 * @apiErrorExample {json} 401 Unauthorized
 *     HTTP/1.1 401 Unauthorized
 *     Content-Type: text/html; charset=utf-8
 *
 *     Authorization header is missing
 * 
 */
router.get('/:id/rating', authenticate, [
  param('id', 'id must be alphanumeric')
    .isAlphanumeric(),
], function(req, res, next) {
    /*Beer.findOne({_id: req.params.id}).exec(function(err, beer) {
      try {
        validationResult(req).throw();
        res.send(BeerSerializer.serialize([beer]));
      } catch (validationError) {
        // Send the error object to the user
        res.status(400).json(validationError);
      }

    });*/
    Beer.aggregate([
      { $unwind: "$comments" },
      { $group : { _id: "$name", rating : {  $avg : "$comments.rating" } } }
    ], function(err, beer) {
        if(err)
          handleError(err);
        res.send(
          {
            "data": [
              {
                "type": "beer",
                "id": req.params.id,
                "attributes": {
                  beer
                }
              }
            ],
        }
          );
    })
});

/**
 * @api {post} /api/v1/beer Create a beer
 * @apiName CreateBeer
 * @apiGroup Beer
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
 * @apiSuccess (Response body) {Object[]} data.attributes.comments List of comments
 * @apiSuccess (Response body) {String} data.attributes.comments.userId Reference to the author user
 * @apiSuccess (Response body) {String} data.attributes.comments.body Content of the comment
 * @apiSuccess (Response body) {Date} data.attributes.comments.date Date when the comment was posted
 * @apiSuccess (Response body) {Number} data.attributes.comments.rating Rating of the beer
 * 
 * @apiExample Example
 *     POST /api/v1/beer HTTP/1.1
 *     Content-Type: application/json
 *
 *     {
 *       "name": "Swaf",
 *       "breweryId": "asd77asdsad9",
 *       "alcoholLevel": "4.8",
 *       "picture": "path"
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
 *                "picture": "path",
 *                "comments": [
 *                  {
 *                    "userId": "619107e1805f1f900c8587e5",
 *                    "body": "C'est pas mal, mais ça manque de gras",
 *                    "rating": 4,
 *                    "_id": "6193fa3ebf7ab30717cde86c",
 *                    "date": "2021-11-16T18:36:46.578Z"
 *                  }
 *                ]
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
 * @apiError {Object} 401/Unauthorized Authorization header is missing
 *
 * @apiErrorExample {json} 401 Unauthorized
 *     HTTP/1.1 401 Unauthorized
 *     Content-Type: text/html; charset=utf-8
 *
 *     Authorization header is missing
 * 
 */
router.post('/', authenticate, [
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
 * @api {delete} /api/v1/beer/:id Delete a beer
 * @apiName DeleteBeer
 * @apiGroup Beer
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
 * 
 * @apiError {Object} 401/Unauthorized Authorization header is missing
 *
 * @apiErrorExample {json} 401 Unauthorized
 *     HTTP/1.1 401 Unauthorized
 *     Content-Type: text/html; charset=utf-8
 *
 *     Authorization header is missing
 * 
 */
router.delete('/', authenticate,  function (req, res) {
  Beer.deleteOne({ id: req.query.id }, function (err) {
    if (err) {
      return next(err);
    }
    res.sendStatus(200);
  });
});

/**
 * @api {post} /api/v1/beer/:id/comment Add a Comment
 * @apiName AddComment
 * @apiGroup Beer
 * @apiDescription Add a new comment.
 *
 * @apiSuccess (Response body) {Object} data Beer data information
 * @apiSuccess (Response body) {String} data.id Unique identifier of the beer
 * @apiSuccess (Response body) {String} data.type Type of ressource
 * @apiSuccess (Response body) {Object} data.attributes Beer attributes information
 * @apiSuccess (Response body) {String} data.attributes.name Name of the beer
 * @apiSuccess (Response body) {String} data.attributes.brewery-id Brewery where the beer was made
 * @apiSuccess (Response body) {Number} data.attributes.alcoholLevel Alcohol level of the beer
 * @apiSuccess (Response body) {String} data.attributes.picture Picture of the beer
 * @apiSuccess (Response body) {Object[]} data.attributes.comments List of comments
 * @apiSuccess (Response body) {String} data.attributes.comments.userId Reference to the author user
 * @apiSuccess (Response body) {String} data.attributes.comments.body Content of the comment
 * @apiSuccess (Response body) {Date} data.attributes.comments.date Date when the comment was posted
 * @apiSuccess (Response body) {Number} data.attributes.comments.rating Rating of the beer
 * 
 * @apiExample Example
 *     POST /api/v1/beer HTTP/1.1
 *     Content-Type: application/json
 *
 *     {
 *        "body": "C'est pas mal, mais ça manque de gras",
 *        "rating": 4,
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
 *                "picture": "path",
 *                "comments": [
 *                  {
 *                    "userId": "619107e1805f1f900c8587e5",
 *                    "body": "C'est pas mal, mais ça manque de gras",
 *                    "rating": 4,
 *                    "_id": "6193fa3ebf7ab30717cde86c",
 *                    "date": "2021-11-16T18:36:46.578Z"
 *                  }
 *                ]
 *               }
 *        }
 *     }
 * 
 * @apiError {Object} 400/BadRequest Some of the comment's properties are invalid
 *
 * @apiErrorExample {json} 400 Bad Request
 *     HTTP/1.1 400 Bad Request
 *     Content-Type: application/json
 *
 *     {
 *       "errors": [
 *       {
 *         "value": "7",
 *         "msg": "rating must be numeric, and between 1 and 5",  
 *         "param": "rating",
 *         "location": "body"
 *       }
 *       ]
 *     }
 * 
 * @apiError {Object} 401/Unauthorized Authorization header is missing
 *
 * @apiErrorExample {json} 401 Unauthorized
 *     HTTP/1.1 401 Unauthorized
 *     Content-Type: text/html; charset=utf-8
 *
 *     Authorization header is missing
 * 
 */
router.post('/:id/comment', authenticate, [
  param('id', 'id must be alphanumeric')
    .isAlphanumeric(),
  body('comment', 'comment can\'t be empty'),
], function(req, res, next) {
  try {
    validationResult(req).throw();

    req.body.userId = req.currentUserId;
    // Create a new mdocument from the JSON in the request body
    Beer.findOneAndUpdate(
      {_id: req.params.id},
      {$push: {comments: req.body}},
      {new: true}).exec(function(err, beer) {
      if (err) {
        return next(err);
      }
      res.send(BeerSerializer.serialize(beer));
    });
    broadcastMessage({
      "action": "beer_comment",
      "user" : "'" + req.currentUserId + "'",
      "beer" : "'" + req.params.id + "'",
    });

  } catch (err) {
    // Send the error object to the user
    res.status(400).json(err);
  }
});

/**
 * @api {patch} /api/v1/beer/id Partially update a beer
 * @apiName PartiallyUpdateBeer
 * @apiGroup Beer
 * @apiDescription Partially updates a beer's data (only the properties found in the request body will be updated).
 * 
 * @apiSuccess (Response body) {Object} data Beer data information
 * @apiSuccess (Response body) {String} data.id Unique identifier of the beer
 * @apiSuccess (Response body) {String} data.type Type of ressource
 * @apiSuccess (Response body) {Object} data.attributes Beer attributes information
 * @apiSuccess (Response body) {String} data.attributes.name Name of the beer
 * @apiSuccess (Response body) {String} data.attributes.brewery-id Brewery where the beer was made
 * @apiSuccess (Response body) {Number} data.attributes.alcoholLevel Alcohol level of the beer
 * @apiSuccess (Response body) {String} data.attributes.picture Picture of the beer
 * @apiSuccess (Response body) {Object[]} data.attributes.comments List of comments
 * @apiSuccess (Response body) {String} data.attributes.comments.userId Reference to the author user
 * @apiSuccess (Response body) {String} data.attributes.comments.body Content of the comment
 * @apiSuccess (Response body) {Date} data.attributes.comments.date Date when the comment was posted
 * @apiSuccess (Response body) {Number} data.attributes.comments.rating Rating of the beer
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
 *                "brewery-id": "kjkas87asdk",
 *                "alcoholLevel": "4.8",
 *                "picture": "path",
 *                "comments": [
 *                  {
 *                    "userId": "619107e1805f1f900c8587e5",
 *                    "body": "C'est pas mal, mais ça manque de gras",
 *                    "rating": 4,
 *                    "_id": "6193fa3ebf7ab30717cde86c",
 *                    "date": "2021-11-16T18:36:46.578Z"
 *                  }
 *                ]
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
router.patch('/', authenticate, function (req, res) {
  Beer.findByIdAndUpdate(req.query.id, req.body, { new: true }, function (err, beer) {
    if (err){
      return next(err);
    }
    res.send(BeerSerializer.serialize(beer));
  });
});

router.use(function(err, req, res, next) {
  res.status(500).send('Something broke!');
});


module.exports = router;