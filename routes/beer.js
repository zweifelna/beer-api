var express = require('express');
var beersRouter = express.Router();

/* GET beers listing. */
beersRouter.get('/', function(req, res, next) {
    res.send('respond with a resource');
  });

module.exports = beersRouter;