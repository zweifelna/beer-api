var express = require('express');
var router = express.Router();

/* GET beers listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a beer resource');
  });

module.exports = router;