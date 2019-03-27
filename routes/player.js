var express = require('express');
var router = express.Router();
  
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

  firstname = firstname.charAt(0).toUpperCase() + firstname.slice(1);
  lastname = lastname.charAt(0).toUpperCase() + lastname.slice(1);

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

  firstname = firstname.charAt(0).toUpperCase() + firstname.slice(1);
  lastname = lastname.charAt(0).toUpperCase() + lastname.slice(1);
  club = club.charAt(0).toUpperCase() + club.slice(1);

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

module.exports = router;
