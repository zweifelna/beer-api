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

/* GET users listing. */
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

/* POST new user */
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

router.delete('/', function (req, res, next) {
  User.deleteOne({ _id: req.query.id }, function (err) {
    if (err) {
      res.status(400).json(err);
    }
    res.sendStatus(200);
  });
});

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
