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
  var duplicatecheck = req.body.duplicatecheck;   // true if coming from addplayer1, false if coming from dupliacte already

  firstname = firstname.charAt(0).toUpperCase() + firstname.slice(1);
  lastname = lastname.charAt(0).toUpperCase() + lastname.slice(1);

  if (duplicatecheck == "true")
  {
    var query = {"selector": {"Lastname": lastname, "Firstname" : firstname } };
    
    db.find(query, function (err, players) {
      if (players.docs.length) {
        res.render('duplicate', { player: players.docs[0] });
      } else {
        var query = {"selector": {"Name": lastname+","+firstname } };
        
        dewisdb.find(query, function (err, dewis) {
          var query = {"selector": {"tournament": {"$gt": "" } } };
          db.find(query, function (err, tournament) {
            res.render('addplayer2', { title: 'Spieler anmelden', firstname : firstname, lastname : lastname, tournament : tournament.docs[0].tournament, dewis: dewis });
          });
        });
      }
    });
  } else {
 
    var query = {"selector": {"Name": lastname+","+firstname } };
        
    dewisdb.find(query, function (err, dewis) {
      var query = {"selector": {"tournament": {"$gt": "" } } };
      db.find(query, function (err, tournament) {
        res.render('addplayer2', { title: 'Spieler anmelden', firstname : firstname, lastname : lastname, tournament : tournament.docs[0].tournament, dewis: dewis });
      });
    });
  };
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
  var datetime = Date.now();
  var capacity = req.body.capacity;
  var title = req.body.title.trim().toUpperCase();
  var yob = req.body.YOB;
 
  firstname = firstname.charAt(0).toUpperCase() + firstname.slice(1);
  lastname = lastname.charAt(0).toUpperCase() + lastname.slice(1);
  club = club.charAt(0).toUpperCase() + club.slice(1);

  // And forward to verify page
  res.render("addplayer3", { Title: title, Firstname: firstname, Lastname: lastname, DWZ: dwz, ELO: elo, YOB: yob, Group: group, Sex: sex, Club: club, email: email, datetime: datetime, dewisid: dewisid, capacity : capacity });
});

function sendConfirmation(tournament, player, playercnt) {
  var ejs = require("ejs");

  ejs.renderFile("views/templates/mail.ejs", { tournament: tournament, player: player, playercnt : playercnt }, function (err, data) {
    if (err) {
        console.log(err);
    } else {

      if (typeof process.env.EMAIL_USER !== 'undefined' && process.env.EMAIL_USER !== null && 
          typeof process.env.EMAIL_PW !== 'undefined' && process.env.EMAIL_PW !== null) {

        var nodemailer = require('nodemailer');
        var transporter = nodemailer.createTransport({
          service: 'SendinBlue',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PW
        }
        });

        const mailOptions = {
          from: tournament.email,     // sender address
          to: 'thomas@fam-petzke.de', // list of receivers
          subject: tournament.shortname + " - Bestätigung der Anmeldung", // Subject line
          html: data                  // plain text body
        };

        transporter.sendMail(mailOptions, function (err, info) {
          if(err)
            console.log(err)
          else
            console.log(info);
        });
      } else console.log("UserId and Password for email provider SendinBlue not found in process environment variables");
    };
  });
}

/* POST to Add Player Service */
router.post('/addplayer', function (req, res) {

  if (req.body.submitted == "save")
  {
    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var title = req.body.title;
    var firstname = req.body.firstname.trim();
    var lastname = req.body.lastname.trim();
    var dwz = req.body.dwz;
    var elo = req.body.elo;
    var yob = req.body.yob;
    var email = req.body.email;
    var group = req.body.group;
    var sex = req.body.sex;
    var club = req.body.club.trim();
    var dewisid = req.body.dewisid;
    var datetime = req.body.datetime;
    var capacity = req.body.capacity;
    var status = "confirmed";         // init to default, will be checked below again 
    var paymentstatus = "open";

    var group_desc = group;
    if (sex=="female") group_desc += " (weiblich)";

    var query = {"selector": {"tournament": {"$gt": "" } } };

    db.find(query, function (err, tournament) {

      db.view('app', 'player-count', function(err, player) {
        if (err) console.log(err);

        // determine the status for the player. If less than tournament capacity players are registered the status is confirmed otherwise waitlisted
        var currentPlayerCnt = player.rows.length?player.rows[0].value:0;
        if (capacity > 0 && currentPlayerCnt >= capacity) status="waitlisted";

        // Insert player to the database    
        var newplayer = { Title: title, Firstname: firstname, Lastname: lastname, DWZ: dwz, ELO: elo, YOB: yob, Group: group, Sex: sex, Club: club, email: email, datetime: datetime, status: status, paymentstatus: paymentstatus, dewis: dewisid };
        db.insert(newplayer).then(console.log);

        if (tournament.docs[0].tournament.sentmails == "true") sendConfirmation(tournament.docs[0].tournament, newplayer, currentPlayerCnt);

        // And forward to success page
        res.render("success", { player: newplayer, Group: group_desc, status: status, capacity: capacity, playercnt : currentPlayerCnt, tournament: tournament.docs[0].tournament});
      });
    });
  
  } else res.redirect("/");
});

module.exports = router;
