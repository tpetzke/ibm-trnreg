var express = require('express');
var router = express.Router();

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
        res.render('index', { tournament: tournament.docs[0].tournament, playercnt: player.rows[0].value });
      });
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

module.exports = router;
