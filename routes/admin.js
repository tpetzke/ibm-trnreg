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
