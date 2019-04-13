var express = require('express');
var router = express.Router();

const Email = require('../classes/email');

/* GET home page.
   Read the Tournament data to presented on the homepage from the database */
router.get('/', function(req, res, next) {
  
  // Set our internal DB variable
  var db = req.db;

  var query = {
      "selector": {
          "tournament": {
              "$gt": ""
          }
      }
  };

  db.find(query, function (err, tournament) {
      // 'tournament' contains results

      db.view('app', 'player-count', function(err, player) {
        if (err) console.log(err);
        var playercnt = 0;
        if (player.rows.length) playercnt = player.rows[0].value;

        res.render('index', { tournament: tournament.docs[0].tournament, playercnt: playercnt });
      });
  });
});

/* GET Imprint page */
router.get('/imprint', function(req, res, next) {
  
  // Set our internal DB variable
  var db = req.db;

  var query = {
      "selector": {
          "tournament": {
              "$gt": ""
          }
      }
  };


  db.find(query, function (err, tournament) {
      // 'tournament' contains results
      res.render('imprint', { tournament: tournament.docs[0].tournament });
  });
});


/*GET Login Page
  Read the Tournament data to presented on the homepage from the database */
  router.get('/login', function(req, res, next) {
  
    // Set our internal DB variable
    var db = req.db;
  
    var query = {
        "selector": {
            "tournament": {
                "$gt": ""
            }
        }
    };
  
    db.find(query, function (err, tournament) {
      // 'tournament' contains results
      if (err) console.log(err);
      res.render('login', { tournament: tournament.docs[0].tournament, message : "Authentifizierung notwendig"});
    });
  });

/*GET Logout
  Destroy the session and forward to index */
  router.get('/logout', function(req, res, next) {
    req.session.destroy();
    res.redirect('/');  
  });


/* POST Login
   Verify User ID and Password and forward to the admin dash board */
   router.post('/login', function(req, res, next) {
  
    bcrypt = require("bcrypt");

    // Set our internal DB variable
    var db = req.db;
  
    var userid = req.body.userid.trim();
    var password = req.body.password.trim();

    var query = {"selector": { "userid":  userid} };
    db.find(query, function(err, users) {
      if (err) console.log(err);
      
      if (users.docs.length) {

        bcrypt.compare(password, users.docs[0].password, function(err, success) {
          if (success) {   // Successful Login
            // sets a cookie with the user's info
            req.session.userid = userid;
            res.locals.userid = userid;
            req.session.level = users.docs[0].level;
            res.locals.level = users.docs[0].level;
            
            res.redirect("/admin/dashboard");
          } else {
            var query = {"selector": {"tournament": {"$gt": "" } } };
            db.find(query, function (err, tournament) {
              if (err) console.log(err);
              res.render('login', { tournament: tournament.docs[0].tournament, message: "Ungültige User Id oder Passwort" });
            });    
          }
        });   
      } else {
        var query = {"selector": {"tournament": {"$gt": "" } } };
        db.find(query, function (err, tournament) {
          if (err) console.log(err);
          res.render('login', { tournament: tournament.docs[0].tournament, message: "Ungültige User Id oder Passwort" });
        });
      }
    });
  });

/* GET clublist page.
   Read the Tournament data and the Club List from the View to assemble an overview page of clubs */
   router.get('/clublist', function(req, res, next) {
  
    // Set our internal DB variable
    var db = req.db;
  
    var query = {
        "selector": {
            "tournament": {
                "$gt": ""
            }
        }
    };

    db.find(query, function (err, tournament) {

      db.view('app', 'club-count', { group:true}, function(err, clubs) {
        
        if (err) console.log("Error accessing view for club grouping with code" + err.error);
        res.render('clublist', { tournament: tournament.docs[0].tournament, clubs:clubs });
      });
    });
  });

/* GET group page.
   Read the Tournament data and the Group List to assemble a Group view
   in the http req the field "idx" points to the index of the requested group in the group array */
   router.get('/group', function(req, res, next) {
  
    // Set our internal DB variable
    var db = req.db;
  
    var query = {
        "selector": {
            "tournament": {
                "$gt": ""
            }
        }
    };

    var idx = parseInt(req.query.idx, 0);
    var group_name = "";
    db.find(query, function (err, tournament) {
      // 'tournament' contains results
      if (idx <0 || idx >= tournament.docs[0].tournament.groups.length) idx = 0;
      group_name = tournament.docs[0].tournament.groups[idx];

      query =  {
        "selector": {
           "Group": group_name
        }
      }

      db.find(query, function (err, data) {
        data.docs.sort(function(a, b) { 
          var twz_a = 0, twz_b = 0; 
          if (a.hasOwnProperty("DWZ")) twz_a = a.DWZ; 
          if (b.hasOwnProperty("DWZ")) twz_b = b.DWZ; 
          if (a.hasOwnProperty("ELO") && a.ELO>twz_a) twz_a = a.ELO; 
          if (b.hasOwnProperty("ELO") && b.ELO>twz_b) twz_b = b.ELO; 
          return twz_b - twz_a; 
        });
        res.render('group', { GroupName: group_name, tournament: tournament.docs[0].tournament, data: data });
      });

    });
  
  });


/* GET club page.
   Read the Tournament data and the player list per club to assemble a club view
   in the http req the field "club" points to the name of the requested club */
router.get('/club', function(req, res, next) {

  // Set our internal DB variable
  var db = req.db;

  var query = {
      "selector": {
          "tournament": {
              "$gt": ""
          }
      }
  };

  var club_name = req.query.club;
  
  db.find(query, function (err, tournament) {
    // 'tournament' contains results
  
    query =  {
      "selector": {
          "Club": club_name
      }
    }

    db.find(query, function (err, data) {
      data.docs.sort(function(a, b) { if(a.Firstname+a.Lastname > b.Firstname+b.Lastname) return 1; else return -1}); 
      res.render('club', { ClubName: club_name, tournament: tournament.docs[0].tournament, data: data });
    });

  });
});

/* GET player maintenance page to allow a player to modify its own details. The player id is given in the request as _id together with a secret key.
   The secret key is calculated from later numbers of the datetime property (seconds and milliseconds) 
  Read the Tournament data and player from the DB to prefill the player input fields */
router.get('/edit4p/id/:_id/:key', function(req, res, next) {

  // Set our internal DB variable
  var db = req.db;
  var _id = req.params._id;
  var key = req.params.key;

  var query = {"selector": {"tournament": {"$gt": ""} } };

  db.find(query, function (err, tournament) {

    var query = {"selector": {"_id": _id}};  
    db.find(query, function (err, players) {
      var secret;
      if (players.docs.length && key == (secret = Email.getSecret(players.docs[0].datetime))) {

        res.render('modplayer4p', { tournament: tournament.docs[0].tournament, player: players.docs[0], key: secret }); 
      } else res.redirect("/");
    });
  });
    
});
  
/* POST player maintenance page to allow a player to modify its own details. 
   The secret key is calculated from later numbers of the datetime property (seconds and milliseconds) 
  Read the Tournament data and player from the DB to prefill the player input fields */
router.post('/edit4p', function(req, res, next) {

  // Set our internal DB variable
  var db = req.db;

  if (req.body.submitted == "save")
  {
    // Get our form values. These rely on the "name" attributes
    var firstname = req.body.firstname.trim();
    var lastname = req.body.lastname.trim();
    var title = req.body.title.trim();
    var dwz = req.body.dwz;
    var elo = req.body.elo;
    var email = req.body.email;
    var group = req.body.group;
    var sex = req.body.sex;
    var club = req.body.club.trim();
    var yob = req.body.yob;
    var _id = req.body._id;
    var key = req.body.key;

    var query = {"selector": {"_id": _id}};   // lookup the player in the database
    db.find(query, function(err, players) {
   
      if (players.docs.length && key == Email.getSecret(players.docs[0].datetime)) {
        var player = players.docs[0];

        // Update player in the database    
        var updateplayer = { _id: _id, _rev: player._rev, Title: title, Firstname: firstname, Lastname: lastname, DWZ: dwz, ELO: elo, YOB: yob, Group: group, Sex: sex, Club: club, email: email, datetime: player.datetime, status: player.status, paymentstatus: player.paymentstatus, dewis: player.dewisid };
        db.insert(updateplayer).then(console.log);

        // And forward to success page
        res.render("confirmupdate", { player: updateplayer, message: "Die Anmeldung wurde aktualisiert" });
      } else res.redirect("/"); 
    }); 
  } else if (req.body.submitted == "delete") {

    var _id = req.body._id;
    var key = req.body.key;
    var query = {"selector": {"_id": _id}};   // lookup the player in the database
    db.find(query, function(err, players) {

      if (players.docs.length && key == Email.getSecret(players.docs[0].datetime)) {
        var player = players.docs[0];

        console.log("Deleting player: "+ player.Lastname +" id: "+_id+" _rev: "+player._rev);
        db.destroy(player._id, player._rev, function(err, body) {
          if (err) console.log(err); else console.log(body);
          res.render("confirmupdate", { player: player, message: "Die Anmeldung wurde gelöscht" });
        });
      } else res.redirect("/"); 
    });

  } else res.redirect("/");
    
});

module.exports = router;
