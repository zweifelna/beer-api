const { url_prefix, database_server, database_name, database_url } = require('./config.js');
const mongoose = require('mongoose');
mongoose.Promise = Promise;

if (!database_url) {
 mongoose.connect('mongodb://' + database_server + '/' + database_name);
} else {
  mongoose.connect(database_url);
};



var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/user');
var beersRouter = require('./routes/beer');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Log requests (except in test mode).
if (process.env.NODE_ENV !== 'test') {
  app.use(logger('dev'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(url_prefix, indexRouter);
app.use(url_prefix + '/user', usersRouter);
app.use(url_prefix + '/beer', beersRouter);

// Serve the apiDoc documentation.
app.use('/api/v1/apidoc', express.static(path.join(__dirname, 'docs')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
