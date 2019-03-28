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
    db.list({include_docs:true}, function (err, players) {
      
      console.log("players found: "+players.rows.length);
      dewisdb.list({include_docs:true}, function (dewis_err, dewis) {
        console.log("dewis records found: "+dewis.rows.length);

        var docs = [];
        players.rows.forEach(element => {
          if(element.doc.dewis) {
            j=0;
            while(j<dewis.rows.length && dewis.rows[j].doc._id !== element.doc.dewis) j++;
            if (j<dewis.rows.length) {
              var player = {_id: element.doc._id, _rev:element.doc._rev, Firstname: element.doc.Firstname, Lastname: element.doc.Lastname, DWZ: dewis.rows[j].doc.DWZ, ELO: dewis.rows[j].doc.ELO, Group: element.doc.Group, Sex: element.doc.Sex, Club: dewis.rows[j].doc.Club, email: element.doc.email, dewis: element.doc.dewis };
              docs.push(player);
            }    
          }
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
    res.render('index', { tournament: tournament.docs[0].tournament });
  });
});

module.exports = router;
