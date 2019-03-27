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
      res.render('index', { tournament: tournament.docs[0].tournament });
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


/* GET setup page.
   Read the Tournament data from the DB to prefill the tournament input fields */
   router.get('/setup', function(req, res, next) {
  
    // Set our internal DB variable
    var db = req.db;
  
    var query = {
        "selector": {
            "tournament": {
                "$gt": ""
            }
        }
    };
  
    db.find(query, function (err, data) {
        // 'data' contains results
        res.render('setup', { data: data });
    });
    
  });
  
/* GET add player Step 1 
   Record Firstname and Lastname of the user */
router.get('/addplayer1', function(req, res, next) {
    res.render('addplayer1');
});

/* POST add player Step 1 
   Firstname and Lastname are entered. 
   Lookup the user in the DEWIS Database 
   Lookup the tournament data and forward to step 2 */
router.post('/lookup_player', function(req, res, next) {

  // Set our internal DB variable
  var dewisdb = req.dewisdb;
  var db = req.db;
  var firstname = req.body.firstname.trim();
  var lastname = req.body.lastname.trim();

  var query = {
      "selector": {
          "Name": lastname+","+firstname
      }
  };

  dewisdb.find(query, function (err, dewis) {
    
    var query = {
      "selector": {
          "tournament": {
              "$gt": ""
          }
      }
    };

    db.find(query, function (err, tournament) {
      res.render('addplayer2', { title: 'Spieler anmelden', firstname : firstname, lastname : lastname, tournament : tournament.docs[0].tournament, dewis: dewis });
    });
  });
});

/* POST to Verify Service */
router.post('/verifyplayer', function (req, res) {

  // Set our internal DB variable
  var db = req.db;

  // Get our form values. These rely on the "name" attributes
  var firstname = req.body.firstname.trim();
  var lastname = req.body.lastname.trim();
  var dwz = req.body.dwz;
  var elo = req.body.elo;
  var email = req.body.email;
  var group = req.body.group;
  var sex = req.body.sex;
  var club = req.body.club.trim();
  var dewisid = req.body.dewisid;

  // And forward to verify page
  res.render("addplayer3", { Firstname: firstname, Lastname: lastname, DWZ: dwz, ELO: elo, Group: group, Sex: sex, Club: club, email: email, dewisid: dewisid });
});


/* POST to Add Player Service */
router.post('/addplayer', function (req, res) {

  if (req.body.submitted == "save")
  {
    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var firstname = req.body.firstname.trim();
    var lastname = req.body.lastname.trim();
    var dwz = req.body.dwz;
    var elo = req.body.elo;
    var email = req.body.email;
    var group = req.body.group;
    var sex = req.body.sex;
    var club = req.body.club.trim();
    var dewisid = req.body.dewisid;

    var group_desc = group;
    if (sex=="female") group_desc += " (weiblich)";

    // Insert player to the database    
    var newplayer = { Firstname: firstname, Lastname: lastname, DWZ: dwz, ELO: elo, Group: group, Sex: sex, Club: club, email: email, dewis: dewisid };
    db.insert(newplayer).then(console.log);

    // And forward to success page
    res.render("success", { Name: firstname + ' ' + lastname, Group: group_desc });
  } else res.redirect("/");
});

/* POST to Tournament Update */
router.post('/setup', function (req, res) {

  // Set our internal DB variable
  var db = req.db;

  // Get our form values. These rely on the "name" attributes
  var _id = req.body._id;
  var _rev = req.body._rev;
  var name = req.body.name;
  var date = req.body.date;
  var location = req.body.location
  var description = req.body.description;
  var announcement= req.body.announcement;
  var groups = req.body.groups.split(",");

  for (i=0; i<groups.length; i++) groups[i] = groups[i].trim();

  var action = req.body.submit;
  
  // Update tournanemt in the database    
  var tournament_doc = {
    _id: _id,
    _rev: _rev,
    tournament: {
    name: name,
    location: location,
    date: date,
    url: announcement,
    description : description,
    groups: groups
  }} 
  db.insert(tournament_doc).then(console.log);

  // retrieve the record again from the database and forward to the index page
  var query = {
      "selector": {"tournament": { "$gt": "" } }
  };

  db.find(query, function (err, data) { res.render('index', { data: data }); });
});


module.exports = router;
