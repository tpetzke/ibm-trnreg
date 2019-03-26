var createError = require('http-errors');
var express = require('express');
var cfenv = require("cfenv");
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const got = require('got');

// load local VCAP configuration  and service credentials
var vcapLocal;
try {
    vcapLocal = require('./vcap-local.json');
    console.log("Loaded local VCAP", vcapLocal);
} catch (e) { }

const appEnvOpts = vcapLocal ? { vcap: vcapLocal } : {}
const appEnv = cfenv.getAppEnv(appEnvOpts);

// Load the Cloudant library.
var Cloudant = require('@cloudant/cloudant');
if (appEnv.services['cloudantNoSQLDB']) {
    cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);
    } else if (process.env.CLOUDANT_URL) {
    cloudant = Cloudant(process.env.CLOUDANT_URL);
}

if (cloudant) {
    //database name
    var dbName = 'players';

    // Create a new "players" database.
    cloudant.db.create(dbName, function (err, data) {
        if (!err) //err if database doesn't already exists
            console.log("Created database: " + dbName);
    });

    // Specify the database we are going to use (mydb)...
    mydb = cloudant.db.use(dbName);
}

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Make our db accessible to our router
app.use(function (req, res, next) {
    req.db = mydb;
    next();
});

// TEST

got('https://ergebnisse.svw.info//tools/dwz.php?aktion=person&name=Petzke,%20Jonas', { json: true }).then(response => {
  console.log(response.body.url);
  console.log(response.body.explanation);
}).catch(error => {
  console.log(error.response.body);
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

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
