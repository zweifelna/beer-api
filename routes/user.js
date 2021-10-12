var express = require('express');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var router = express.Router();
const User = require('../models/user');
var UserSerializer = new JSONAPISerializer('user', {
  attributes: ['firstname', 'lastname'],
  pluralizeType: false
});

/* GET users listing. */
router.get('/', function(req, res, next) {

  if(req.query.id) {
    User.findOne({id: req.query.id}).exec(function(err, user) {
      if (err) {
        return next(err);
      }
      res.send(UserSerializer.serialize(user));
    });
  } else {
    User.find().sort('name').exec(function(err, user) {
      if (err) {
        return next(err);
      }
      res.send(UserSerializer.serialize(user));
    });
  }

});

/* POST new user */
router.post('/', function(req, res, next) {
  // Create a new document from the JSON in the request body
  const newUser = new User(req.body);
  console.log(newUser);
  // Save that document
  newUser.save(function(err, savedUser) {
    if (err) {
      return next(err);
    }
    // Send the saved document in the response
    res.send(UserSerializer.serialize(savedUser));
  });
});

router.delete('/', function (req, res) {
  User.deleteOne({ id: req.query.id }, function (err) {
    if (err) {
      return next(err);
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

module.exports = router;
