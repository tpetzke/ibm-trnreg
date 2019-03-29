var express = require('express');
var router = express.Router();

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

  if (action=="refresh")
  {
    var query = {"selector": {"Lastname": {"$gt": ""}}, "sort": [{"datetime": "asc"}]};  

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
          
          if (docs.length +1 < capacity) newstatus = "confirmed"; else newstatus = "waitlisted";

          if(element.dewis) {
            j=0;
            while(j<dewis.rows.length && dewis.rows[j].doc._id !== element.dewis) j++;
            if (j<dewis.rows.length) {
              newdwz = dewis.rows[j].doc.DWZ;
              newelo = dewis.rows[j].doc.ELO;
              newclub = dewis.rows[j].doc.Club;
            }
          }

          var player = {_id: element._id, _rev:element._rev, Firstname: element.Firstname, Lastname: element.Lastname, DWZ: newdwz, ELO: newelo, Group: element.Group, Sex: element.Sex, Club: newclub, email: element.email, dewis: element.dewis, status: newstatus, datetime: element.datetime };
          docs.push(player);
        });
        
        db.bulk({ docs:docs }, function(err) { if (err) { throw err; }});  
      });  
    });
  };

  // retrieve the record again from the database and forward to the index page
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

module.exports = router;
