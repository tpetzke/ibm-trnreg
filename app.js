var createError = require('http-errors');
var express = require('express');
var cfenv = require('cfenv');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('client-sessions');

// read the .env file and make the value of VARIABLE available via process.env.VARIABLE
require('dotenv').config(); 

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
    var dbPlayersName = 'players';

    // Create a new "players" database.
    cloudant.db.create(dbPlayersName, function (err, data) {
        if (!err) { //err if database doesn't already exists
            console.log("Created database: " + dbPlayersName);
            
            var dbutils = require('./routes/dbutils');
            playerdb = cloudant.db.use(dbPlayersName);
            dbutils.dbInit(playerdb, null, function() {
                console.log("DB initialised...");
            });
        }
    });

    // Specify the database we are going to use (playerdb)...
    playerdb = cloudant.db.use(dbPlayersName);

    var dbDewisName = 'dewis';

    // Create a new "dewis" database.
    cloudant.db.create(dbDewisName, function (err, data) {
        if (!err) //err if database doesn't already exists
            console.log("Created database: " + dbDewisName);
    });

    // Specify the database we are going to use (dewisdb)...
    dewisdb = cloudant.db.use(dbDewisName);

}

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var playerRouter = require('./routes/player');
var adminRouter = require('./routes/admin');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// make our session object usable, timeout 30 minutes
app.use(session({
    cookieName: 'session',
    secret: 'tournament-website-geheimnis',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
    httpOnly: true,
    secure: true,
    ephemeral: true
}));

// Make our db and session user name accessible to our router
app.use(function (req, res, next) {
    req.db = playerdb;
    req.dewisdb = dewisdb;
    res.locals.userid = req.session.userid;
    res.locals.level = req.session.level;
    next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/player',playerRouter);
app.use('/admin', adminRouter);

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
