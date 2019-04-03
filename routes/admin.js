var express = require('express');
var router = express.Router();

/* Global function that checks for a user in the http request and if not present forwards to the login page 
   this is included in the function call that require a looged in user */ 
function requireLogin (req, res, next) {
  if (!req.session.userid) {
    res.redirect('/login');
  } else {
    next();
  }
};

/* GET setup page.
   Read the Tournament data from the DB to prefill the tournament input fields */
   router.get('/setup', requireLogin, function(req, res, next) {
  
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
  
/* POST to Tournament Update */
router.post('/setup', function (req, res) {

  // Set our internal DB variable
  var db = req.db;
  var dewisdb = req.dewisdb;
  
  // Get our form values. These rely on the "name" attributes
  var _id = req.body._id;
  var _rev = req.body._rev;
  var name = req.body.name;
  var date = req.body.date;
  var capacity = req.body.capacity;
  var location = req.body.location
  var description = req.body.description;
  var announcement= req.body.announcement;
  var groups = req.body.groups.split(",");

  for (i=0; i<groups.length; i++) groups[i] = groups[i].trim();

  var action = req.body.submit;
  
  // Update tournament in the database    
  var tournament_doc = {
    _id: _id,
    _rev: _rev,
    tournament: {
    name: name,
    location: location,
    date: date,
    url: announcement,
    description : description,
    capacity : capacity,
    groups: groups
  }} 
  
  if (action=="update")
  {
    db.insert(tournament_doc).then(console.log);
  }  

  if (action=="init")
  {
    console.log("Init Request received")
  }
  
  res.redirect("/admin/dashboard");
});

/* Post to the refresh playerlist
   Refresh the player list data by reading the dewis database and checking capacity constraints */
router.post('/refreshplayerlist', function(req, res, next) {

  // Set our internal DB variable
  var db = req.db;
  var dewisdb = req.dewisdb;
  
  // Get our form values. These rely on the "name" attributes
  var capacity = parseInt(req.body.capacity);

  // sort players by status and then by datetime, confirmed players are always ordered before waitlisted players
  var query = {"selector": {"Lastname": {"$gt": ""}}, "sort": ["status","datetime"]};  

  db.find(query, function (err, players) {
    
    console.log("players found: "+players.docs.length);
    dewisdb.list({include_docs:true}, function (dewis_err, dewis) {
      console.log("dewis records found: "+dewis.rows.length);

      var docs = [];
    
      players.docs.forEach(element => {

        // check whether we have to change the status of the player due to cancellations or capacity changes
        var newstatus; 
        var newdwz = element.DWZ;
        var newelo = element.ELO;
        var newclub = element.Club;
        var name = element.Lastname+","+element.Firstname;

        newstatus = element.status;
        if (docs.length  < capacity) newstatus = "confirmed"; 

        
        j=0;
        while(j<dewis.rows.length && dewis.rows[j].doc.Name !== name) j++;
        if (j<dewis.rows.length) {
          newdwz = dewis.rows[j].doc.DWZ;
          newelo = dewis.rows[j].doc.ELO;
          newclub = dewis.rows[j].doc.Club;
        }

        var player = {_id: element._id, _rev:element._rev, Firstname: element.Firstname, Lastname: element.Lastname, DWZ: newdwz, ELO: newelo, Group: element.Group, Sex: element.Sex, Club: newclub, email: element.email, dewis: element.dewis, status: newstatus, datetime: element.datetime };
        docs.push(player);
      });
      
      db.bulk({ docs:docs }, function(err) { if (err) { throw err; }});  
      res.redirect('/admin/allplayer');
    });  
  });


});

/* GET all player page.
   Read the Tournament data from the DB to prefill the tournament input fields */
  router.get('/allplayer', requireLogin, function(req, res, next) {

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

    var query = {"selector": {"Lastname": {"$gt": ""}}, "sort": ["status","datetime"]};  
    db.find(query, function (err, players) {

      res.render('allplayer', { tournament: tournament.docs[0].tournament, players: players });
    });
  });
  
});

/* GET single player maintenance page. The player id is given in the request as _id.
  Read the Tournament data and player from the DB to prefill the player input fields */
router.get('/player/id/:id', requireLogin, function(req, res, next) {

  // Set our internal DB variable
  var db = req.db;
  var id = req.params.id;

  var query = {
      "selector": {
          "tournament": {
              "$gt": ""
          }
      }
  };

  db.find(query, function (err, tournament) {

    var query = {"selector": {"_id": id}};  
    db.find(query, function (err, players) {
      if (players.docs.length) res.render('modplayer', { tournament: tournament.docs[0].tournament, player: players.docs[0] }); else res.redirect("/");
    });
  });
  
});

/* POST from the modify player page
    we have to check whether the pressed button was the save button then we save 
    we will forward in both cases back to the player listing */
router.post('/modifyplayer', function(req, res, next) {

  // Set our internal DB variable
  var db = req.db;

  if (req.body.submitted == "save")
  {
    // Get our form values. These rely on the "name" attributes
    var firstname = req.body.firstname.trim();
    var lastname = req.body.lastname.trim();
    var dwz = req.body.dwz;
    var elo = req.body.elo;
    var email = req.body.email;
    var group = req.body.group;
    var sex = req.body.sex;
    var club = req.body.club.trim();
    var status = req.body.status;
    var _id = req.body._id;

    var query = {"selector": {"_id": _id}};   // lookup the player in the database
    db.find(query, function(err, players) {
      var player = players.docs[0];
      console.log("id: "+_id+" _rev: "+player._rev);
        // Update player in the database    
      var updateplayer = { _id: _id, _rev: player._rev, Firstname: firstname, Lastname: lastname, DWZ: dwz, ELO: elo, Group: group, Sex: sex, Club: club, email: email, datetime: player.datetime, status: status, dewis: player.dewisid };
      db.insert(updateplayer).then(console.log);
    
      res.redirect("/admin/allplayer");
    }); 
  } else if (req.body.submitted == "delete") {

    var _id = req.body._id;
    var query = {"selector": {"_id": _id}};   // lookup the player in the database
    db.find(query, function(err, players) {
      var player = players.docs[0];
      console.log("Deleting player: "+ player.Lastname +" id: "+_id+" _rev: "+player._rev);
      db.destroy(player._id, player._rev, function(err, body) {
        if (err) console.log(err); else console.log(body);
        res.redirect("/admin/allplayer");
      });
    });

  } else res.redirect("/admin/allplayer");
});

/* GET Dashboard */
router.get('/dashboard', requireLogin, function(req, res, next) {

  // Set our internal DB variable
  var db = req.db;

  var query = {"selector": {"tournament": {"$gt": "" } } };

  db.find(query, function (err, tournament) {
    if (err) console.log(err);
    var query = {"selector": {"Lastname": {"$gt": "" } } };
    
    db.find(query, function (err, players) {
      if (err) console.log(err);
      res.render('dashboard', { tournament: tournament.docs[0].tournament, players: players.docs });
    });
  });
});

/* GET Password Page 
   find the current user in the DB and forward to the set password page */
router.get('/password', requireLogin, function(req, res, next) {

  // Set our internal DB variable
  var db = req.db;
  var userid = req.session.userid;

  var query = {"selector": {"tournament": {"$gt": "" } } };

  db.find(query, function (err, tournament) {
    if (err) console.log(err);
    var query = {"selector": { "userid":  userid} };
    
    db.find(query, function (err, users) {
      if (err) console.log(err);
      if (users.docs.length)
        res.render('password', { tournament: tournament.docs[0].tournament, userid: userid }); else res.redirect("/admin/dashboard");
    });
  });
});

/* POST Password Page 
   change the password for the current user */
   router.post('/password', requireLogin, function(req, res, next) {

    // Set our internal DB variable
    var db = req.db;
    var userid = req.session.userid;
    var pw = req.body.password1;        // FIXME: Hash PW

    var query = {"selector": { "userid":  userid} };
      
    db.find(query, function (err, users) {
      if (err) console.log(err);
      if (users.docs.length) {

        var u = users.docs[0];
        var updateuser = { _id: u._id, _rev: u._rev, userid: u.userid, password: pw, level: u.level };
        db.insert(updateuser).then(console.log);
    
        res.redirect("/admin/dashboard");
      }
    });
  });

  /* GET userlist Page 
   This page lists the currently defined users and webmasters */
router.get('/userlist', requireLogin, function(req, res, next) {

  // Set our internal DB variable
  var db = req.db;

  var query = {"selector": {"tournament": {"$gt": "" } } };

  db.find(query, function (err, tournament) {
    if (err) console.log(err);
  
    var query = {"selector": { "userid": {"$gt": ""} } };
    db.find(query, function(err, users) {
      if (err) console.log(err);
      res.render('userlist', { tournament: tournament.docs[0].tournament, users: users.docs, message: "Aktuell zugelassende Portal Nutzer" });
    });
  });
});    


  /* GET Webmaster Page 
   The page can be used to create a new or to change an existing webmaster 
   if userid is 0 then a new webmaster is created otherwise the existing one with that id modified */
router.get('/webmaster/id/:_id/:action', requireLogin, function(req, res, next) {

  // Set our internal DB variable
  var db = req.db;
  var _id = req.params._id;
  var action = req.params.action;

   var query = {"selector": {"tournament": {"$gt": "" } } };

  db.find(query, function (err, tournament) {
    if (err) console.log(err);
  
    if (action == "new")  // create a new webmaster
    {
      var title = "Weiteren Turnierleiter Account anlegen";
      res.render('webmaster', { tournament: tournament.docs[0].tournament, title: title, _id: "", userid: "", level: "root" });
    
    
    } else if (action == "edit") {
      var title = "Turnierleiter Account aktualisieren";
      var query = {"selector": { "_id":  _id} };
      db.find(query, function(err, users) {
        if (err) console.log(err);
        if (users.docs.length) {   
          res.render('webmaster', { tournament: tournament.docs[0].tournament, title: title, _id: _id, userid: users.docs[0].userid, level: users.docs[0].level });
        } else res.redirect("/admin/dashboard");
      });  
    
    
    } else if (action == "delete") {
      var query = {"selector": { "_id":  _id} };
      db.find(query, function(err, users) {
        if (err) console.log(err);
        if (users.docs.length) {
          db.destroy(users.docs[0]._id, users.docs[0]._rev, function(err, body) {
            if (err) console.log(err); else console.log(body);       
            res.redirect('/admin/userlist');  
          });
        } else res.redirect('/admin/userlist');
      });  
    } else res.redirect('/admin/userlist');
  });
});
  
/* POST Webmaster Page 
   If we get an empty _id value we insert a new webmaster otherwise we look for the one with the _id and update it */
router.post('/webmaster', requireLogin, function(req, res, next) {

  // Set our internal DB variable
  var db = req.db;
  
  var _id = req.body._id;
  var userid = req.body.userid.trim();
  var password = req.body.password1.trim();  // FIXME Hash Password
  var level = req.body.level;
  var message = "";  

  var query = {"selector": { "userid":  userid} };
  
  if (res.locals.level == "root") {         // check whether the user level is high enough to modify user data

    db.find(query, function(err, users) {
      var usercnt = users.docs.length;      // check how many users with that userid exist already

      if (_id == "")
      {
          if (usercnt == 0)
          {
            var webmaster = { userid: userid, password: password, level: level };
            db.insert(webmaster).then(res.redirect("/admin/userlist"));
            message = "Neuen Nutzer mit User Id: "+userid+" angelegt";
          } else message="Fehler! Userid "+userid+" already exists";
          console.log(message);
      } else {

        var query = {"selector": { "_id":  _id} };
        db.find(query, function(err, users) {
          if (err) console.log(err);
          if (users.docs.length) {
            if (userid == users.docs[0].userid || !usercnt)
            {  
              var webmaster = { _id: users.docs[0]._id, _rev: users.docs[0]._rev, userid: userid, password: password, level: level };
              db.insert(webmaster).then(res.redirect("/admin/userlist"));
              message = "Nutzer Daten für "+userid+" aktualisiert";
            } else message="Fehler! Userid "+userid+" already exists";
          }
          console.log(message);
        });  
      }
    }); 
  } else console.log("Berechtigungsfehler!");
});

module.exports = router;
