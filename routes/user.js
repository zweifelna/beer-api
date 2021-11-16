var express = require('express');
const { secretKey, url } = require('../config.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var JSONAPIError = require('jsonapi-serializer').Error;
const { check, body, query, param, validationResult }
    = require('express-validator');
var router = express.Router();
const User = require('../models/user');
var UserSerializer = new JSONAPISerializer('user', {
  dataLinks: {
    self: function(user) {
      console.log(user);
      return url + '/user/' + user.toObject()._id;
    },
  },
  attributes: ['username', 'firstname', 'lastname'],
  pluralizeType: false
});
const {authenticate} = require('./auth');
const { broadcastMessage } = require('../ws');


/**
 * @api {post} /login Log in
 * @apiName Login
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiDescription Log in the api
 * 
 * @apiSuccess (Response body) {Object[]} data List of users data
 * @apiSuccess (Response body) {String} data.type Type of ressource
 * @apiSuccess (Response body) {String} data.id Unique identifier of the user
 * @apiSuccess (Response body) {String} data.links User affiliated ressource link
 * @apiSuccess (Response body) {Object} data.attributes User attributes information
 * @apiSuccess (Response body) {String} data.attributes.firstname First name of the user
 * @apiSuccess (Response body) {String} data.attributes.lastname Last name of the user
 *
 * @apiExample Example
 *     GET /api/v1/user HTTP/1.1
 *
 * @apiSuccessExample 200 OK
 *     HTTP/1.1 200 OK
 *     Content-Type: application/json
 *       {
 *          "data": {
 *              "type": "user",
 *              "id": "58b2926f5e1def0123e97281",
 *              "links": {
 *                "self": "undefined/api/v1/user/58b2926f5e1def0123e97281"
 *              },
 *              "attributes": {
 *                "firstname": "John",
 *                "lastname": "Doe"
 *               }
 *          }
 *       }
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

router.post('/login', function(req, res, next) {
  User.findOne({ username: req.body.username }).exec(function(err, user) {
    if (err) {
      return next(err);
    } else if (!user) {
      return res.sendStatus(401);
    }
    
    bcrypt.compare(req.body.password, user.password, function(err, valid) {
      if (err) { return next(err); }
      else if (!valid) { return res.sendStatus(401); }
      // Generate a valid JWT which expires in 7 days.
      const exp_length = 7 * 24 * 3600;
      const exp = Math.floor(Date.now() / 1000) + exp_length;
      const payload = { sub: user._id.toString(), exp: exp };
      jwt.sign(payload, secretKey, function(err, token) {
        const response = {
          data: {
            id: "",
            type: "token",
            attributes: {
              access_token: token,
              token_type: "Bearer",
              expires_in: exp_length
            }
          }
        };
        response.data.id = Date.now();
        res.send(response);
        if (err) { return next(err); }
        broadcastMessage({ hello: 'world' });
        res.send(TokenSerializer.serialize(tokenToSend)); // Send the token to the client.
      });
    });
  })
});

/**
 * @api {get} /user List users
 * @apiName GetUsers
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiDescription Return a list of users
 * 
 * @apiSuccess (Response body) {Object[]} data List of users data
 * @apiSuccess (Response body) {String} data.type Type of ressource
 * @apiSuccess (Response body) {String} data.id Unique identifier of the user
 * @apiSuccess (Response body) {String} data.links User affiliated ressource link
 * @apiSuccess (Response body) {Object} data.attributes User attributes information
 * @apiSuccess (Response body) {String} data.attributes.firstname First name of the user
 * @apiSuccess (Response body) {String} data.attributes.lastname Last name of the user
 *
 * @apiExample Example
 *     GET /api/v1/user HTTP/1.1
 *
 * @apiSuccessExample 200 OK
 *     HTTP/1.1 200 OK
 *     Content-Type: application/json
 *       {
 *          "data": [
 *              "type": "user",
 *              "id": "58b2926f5e1def0123e97281",
 *              "links": {
 *                "self": "undefined/api/v1/user/58b2926f5e1def0123e97281"
 *              },
 *              "attributes": {
 *                "firstname": "John",
 *                "lastname": "Doe"
 *               },
 *               "type": "user",
 *               "id": "32sfdsf191dgfds454dsfs3e",
 *              "links": {
 *                "self": "undefined/api/v1/user/32sfdsf191dgfds454dsfs3e"
 *              },
 *               "attributes": {
 *               "firstname": "Alice",
 *               "lastname": "Robert"
 *               }
 *          ]
 *       }
 * 
 * @apiError {Object} 401/Unauthorized Authorization header is missing
 *
 * @apiErrorExample {json} 401 Unauthorized
 *     HTTP/1.1 401 Unauthorized
 *     Content-Type: text/html; charset=utf-8
 *
 *     Authorization header is missing
 */
router.get('/', authenticate, function(req, res, next) {
    User.find().sort('name').exec(function(err, user) {
      res.send(UserSerializer.serialize(user));
    });
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
 * @apiSuccess (Response body) {Object} data User data
 * @apiSuccess (Response body) {String} data.type Type of ressource
 * @apiSuccess (Response body) {String} data.id Unique identifier of the user
 * @apiSuccess (Response body) {String} data.links User affiliated ressource link
 * @apiSuccess (Response body) {Object} data.attributes User attributes information
 * @apiSuccess (Response body) {String} data.attributes.firstname First name of the user
 * @apiSuccess (Response body) {String} data.attributes.lastname Last name of the user
 *
 * @apiExample Example
 *     GET /api/v1/user/58b2926f5e1def0123e97281 HTTP/1.1
 *
 * @apiSuccessExample 200 OK
 *     HTTP/1.1 200 OK
 *     Content-Type: application/json
 *       {
 *          "data":{
 *              "type": "user",
 *              "id": "58b2926f5e1def0123e97281",
 *              "links": {
 *                "self": "undefined/api/v1/user/58b2926f5e1def0123e97281"
 *              },
 *              "attributes": {
 *                "firstname": "John",
 *                "lastname": "Doe"
 *               }
 *          }
 *       }
 * 
 * @apiError {Object} 400/BadRequest Some of the user's properties are invalid
 *
 * @apiErrorExample {json} 400 Bad Request
 *     HTTP/1.1 400 Bad Request
 *     Content-Type: application/json
 *
 *     {
 *       "errors": [
 *       {
 *         "value": "616;^",
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
 */
router.get('/:id', authenticate, [
  param('id', 'id must be alphanumeric')
    .isAlphanumeric(),
], function(req, res, next) {
  User.findOne({_id: req.params.id}).exec(function(err, user) {
    try {
      validationResult(req).throw();
      res.send(UserSerializer.serialize([user]));
    } catch (validationError) {
      // Send the error object to the user
      res.status(400).json(validationError);
    }

  if(req.query.id) {
    User.findOne({_id: req.params.id}).exec(function(err, user) {
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
});

/**
 * @api {post} /api/v1/user Create a user
 * @apiName CreateUser
 * @apiGroup User
 * @apiVersion 1.0.0
 * @apiDescription Registers a new user.
 *
 * @apiSuccess (Response body) {Object} data User data information
 * @apiSuccess (Response body) {String} data.id Unique identifier of the user
 * @apiSuccess (Response body) {String} data.type Type of ressource
 * @apiSuccess (Response body) {Object} data.attributes User attributes information
 * @apiSuccess (Response body) {String} data.attributes.firstname The user's firstname
 * @apiSuccess (Response body) {String} data.attributes.lastname The user's lastname
 *
 * @apiExample Example
 *     POST /api/v1/user HTTP/1.1
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
 *
 *     "data": {
 *              "type": "beer",
 *              "id": "58b2926f5e1def0123e97281",
 *              "links": {
 *                "self": "undefined/api/v1/user/58b2926f5e1def0123e97281"
 *              },
 *              "attributes": {
 *                "firstname": "John",
 *                "lastname": "Doe"
 *               }
 *        }
 * 
 * @apiError {Object} 400/BadRequest Some of the user's properties are invalid
 *
 * @apiErrorExample {json} 400 Bad Request
 *     HTTP/1.1 400 Bad Request
 *     Content-Type: application/json
 *
 *     {
 *       "errors": [
 *       {
 *         "value": "joe322",
 *         "msg": "username should contain only alpha characters",  
 *         "param": "username",
 *         "location": "body"
 *       }
 *       ]
 *     }
 * 
 */
router.post('/',[
  body('username').custom(value => {
    return User.findOne({username: value}).then(user => {
      if (user) {
        return Promise.reject('username already in use');
      }
    });
  }),
  body('username', 'username can\'t be empty')
    .not().isEmpty(),
  body('username', 'username can\'t be empty')
    .not().isEmpty(),
  body('firstname', 'firstname can\'t be empty')
    .not().isEmpty(),
  body('lastname', 'lastname can\'t be empty')
    .not().isEmpty(),
  body('username', 'username must not have more than 255 characters')
    .isLength({max: 255 }),
  body('firstname', 'firstname must not have more than 255 characters')
    .isLength({max: 255 }),
  body('lastname', 'lastname must not have more than 255 characters')
    .isLength({max: 255 }),
  body('username', 'username should contain only alpha characters')
    .isAlpha('en-US', {ignore: '-_'}),
  body('firstname', 'firstname should contain only alpha characters')
    .isAlpha('en-US', {ignore: '-'}),
  body('lastname', 'lastname should contain only alpha characters')
    .isAlpha('en-US', {ignore: ' -'}),
], function(req, res, next) {
  try {
    validationResult(req).throw();

    const plainPassword = req.body.password;
    const costFactor = 10;

    bcrypt.hash(plainPassword, costFactor, function(err, hashedPassword) {
      if (err) {
        return next(err);
      }
      const newUser = new User(req.body);
      newUser.password = hashedPassword;
      newUser.save(function(err, savedUser) {
        if (err) {
          return next(err);
        }
        res.send(UserSerializer.serialize(savedUser));
      });
    });
  } catch (err) {
    // Send the error object to the user
    res.status(400).json(err);
  }
});

/**
 * @api {delete} /api/v1/user/id Delete a user
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
 * 
 * @apiError {Object} 400/BadRequest You can delete only your account
 *
 * @apiErrorExample {json} 400 Bad Request
 *     HTTP/1.1 400 Bad Request
 *     Content-Type: application/json
 *
 *     "You can delete only your account!"
 * 
 * @apiError {Object} 401/Unauthorized Authorization header is missing
 *
 * @apiErrorExample {json} 401 Unauthorized
 *     HTTP/1.1 401 Unauthorized
 *     Content-Type: text/html; charset=utf-8
 *
 *     Authorization header is missing
 */
router.delete('/:id', authenticate, [
  param('id', 'user does not exist')
    .isMongoId(),
], function (req, res, next) {
  if(req.currentUserId == req.params.id) {
    try {
      validationResult(req).throw();
      User.deleteOne({ _id: req.params.id }, function (err) {
        res.sendStatus(200);
      });
    } catch (err) {
      res.status(400).json(err);
    }
  } else {
    var error = new JSONAPIError({
      status: "403",
      title: "You can delete only your account!",
    });
    res.status(400).json(error);
  }
});

/**
 * @api {patch} /api/v1/user/id Partially update a user
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
 *     "data": {
 *              "type": "beer",
 *              "id": "58b2926f5e1def0123e97281",
 *              "attributes": {
 *                "firstname": "Bob",
 *                "lastname": "Doe"
 *               }
 *        }
 * 
 * @apiError {Object} 400/BadRequest You can modify only your information
 * 
 * @apiErrorExample {json} 400 Bad Request
 *     HTTP/1.1 400 Bad Request
 *     Content-Type: application/json
 *
 *     "You can modify only your informations!"
 * 
 * @apiError {Object} 401/Unauthorized Authorization header is missing
 *
 * @apiErrorExample {json} 401 Unauthorized
 *     HTTP/1.1 401 Unauthorized
 *     Content-Type: text/html; charset=utf-8
 *
 *     Authorization header is missing
 * 
 * @apiError {Object} 404/Forbidden The password can't be changed by this route.
 * 
 * @apiErrorExample {json} 403 Forbidden
 *     HTTP/1.1 403 Forbidden
 *     Content-Type: application/json
 *
 *     "The password can't be changed by this route."
 * 
 */
router.patch('/:id', authenticate, function (req, res) {
  if(req.currentUserId == req.params.id) {
    if(req.body.password) {
      var error = new JSONAPIError({
        status: "403",
        title: "The password can\'t be changed by this route.",
      });
      res.status(400).json(error);
    } else {
      User.findByIdAndUpdate(req.params.id, req.body, { new: true }, function (err, user) {
        if (err){
          return next(err);
        }
        res.send(UserSerializer.serialize(user));
      });
    }
  } else {
    var error = new JSONAPIError({
      status: "403",
      title: 'You can modify only your informations!',
    });
    res.status(400).json(error);
  }
});


router.use(function(err, req, res, next) {
  console.error(err.stack);
  var error = new JSONAPIError({
    status: "500",
    title: 'Something broke!',
  });
  res.status(500).json(error);
});


module.exports = router;
