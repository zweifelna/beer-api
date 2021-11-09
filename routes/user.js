var express = require('express');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var JSONAPIError = require('jsonapi-serializer').Error;
const { check, body, query, validationResult }
    = require('express-validator');
var router = express.Router();
const User = require('../models/user');
var UserSerializer = new JSONAPISerializer('user', {
  attributes: ['firstname', 'lastname'],
  pluralizeType: false
});

/**
 * @api {get} /user/:id Request a user's information
 * @apiName GetUser
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiDescription Return the user with the id in parameter
 *
 * @apiParam {String} id Unique identifier of the user
 *
 * @apiExample Example
 *     GET /api/v1/user/58b2926f5e1def0123e97281 HTTP/1.1
 *
 * @apiSuccessExample 200 OK
 *     HTTP/1.1 200 OK
 *     Content-Type: application/json
 *       {
 *         "id": "58b2926f5e1def0123e97281",
 *         "firstname": "John",
 *         "lastname": "Doe"
 *       }
 */
router.get('/',[
  query('id', 'id must be alphanumeric')
    .isAlphanumeric(),
], function(req, res, next) {

  if(req.query.id) {
    User.findOne({_id: req.query.id}).exec(function(err, user) {
      try {
        validationResult(req).throw();
        res.send(UserSerializer.serialize([user]));
      } catch (validationError) {
        // Send the error object to the user
        res.status(400).json(validationError);
      }

    });
  } else {
    User.find().sort('name').exec(function(err, user) {
      res.send(UserSerializer.serialize(user));
    });
  }

});

/**
 * @api {post} /api/v1/user Create a user
 * @apiName CreateUser
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiDescription Registers a new user.
 *
 * @apiSuccess (Response body) {String} id A unique identifier for the user generated by the server
 *
 * @apiExample Example
 *     POST /api/user HTTP/1.1
 *     Content-Type: application/json
 *
 *     {
 *       "firstname": "John",
 *       "lastname": "Doe"
 *     }
 *
 * @apiSuccessExample 201 Created
 *     HTTP/1.1 201 Created
 *     Content-Type: application/json
 *     Location: https://comem-rest-demo.herokuapp.com/api/movies/58b2926f5e1def0123e97281
 *
 *     {
 *       "id": "58b2926f5e1def0123e97281",
 *       "firstname": "John",
 *       "lastname": "Doe"
 *     }
 */
router.post('/',[
  body('firstname', 'firstname can\'t be empty')
    .not().isEmpty(),
  body('lastname', 'lastname can\'t be empty')
    .not().isEmpty(),
  body('firstname', 'firstname must not have more than 255 characters')
    .isLength({max: 255 }),
  body('lastname', 'lastname must not have more than 255 characters')
    .isLength({max: 255 }),
  body('firstname', 'firstname should contain only alpha characters')
    .isAlpha('en-US', {ignore: '-'}),
  body('lastname', 'lastname should contain only alpha characters')
    .isAlpha('en-US', {ignore: ' -'}),
], function(req, res, next) {
  try {
    validationResult(req).throw();

    // Create a new document from the JSON in the request body
    const newUser = new User(req.body);

    // Save that document
    newUser.save(function(err, savedUser) {
      if (err) {
        return next(err);
      }
      // Send the saved document in the response
      res.send(UserSerializer.serialize(savedUser));
    });
  } catch (err) {
    // Send the error object to the user
    res.status(400).json(err);
  }
});

/**
 * @api {delete} /api/v1/user/:id Delete a user
 * @apiName DeleteUser
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiDescription Permanently deletes a user.
 *
 * @apiExample Example
 *     DELETE /api/v1/user/58b2926f5e1def0123e97bc0 HTTP/1.1
 *
 * @apiSuccessExample 204 No Content
 *     HTTP/1.1 204 No Content
 */
router.delete('/', function (req, res, next) {
  User.deleteOne({ _id: req.query.id }, function (err) {
    if (err) {
      res.status(400).json(err);
    }
    res.sendStatus(200);
  });
});

/**
 * @api {patch} /api/v1/user/:id Partially update a user
 * @apiName PartiallyUpdateUser
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiDescription Partially updates a user's data (only the properties found in the request body will be updated).
 * All properties are optional.
 *
 * @apiExample Example
 *     PATCH /api/v1/user/58b2926f5e1def0123e97281 HTTP/1.1
 *     Content-Type: application/json
 *
 *     {
 *       "firstname": "Bob"
 *     }
 *
 * @apiSuccessExample 200 OK
 *     HTTP/1.1 200 OK
 *     Content-Type: application/json
 *
 *     {
 *       "id": "58b2926f5e1def0123e97281",
 *       "firstname": "Bob",
 *       "lastname": "Doe"
 *     }
 */
router.patch('/', function (req, res) {
  User.findByIdAndUpdate(req.query.id, req.body, { new: true }, function (err, user) {
    if (err){
      return next(err);
    }
    res.send(UserSerializer.serialize(user));
  });
});


router.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


module.exports = router;
