exports.dbInit = function(db, createInitialContent, callback) { 
    console.log("Initializing database: " + db.config.db);

    // Insert the views for player and club counting
    var dbview = {  
        "_id":"_design/app",
        "views":{  
           "club-count":    {  
                "reduce":"_count",
                "map":"function (doc) {\n  if (doc.Club) emit(doc.Club, null);\n}"
           },
           "player-count":  {  
                "reduce":"_count",
                "map":"function (doc) {\n  if (doc.Lastname) emit(doc._id, null);\n}"
            }
        },
        "language":"javascript"
    }
    
    // Insert a query index for the player status and datetime
    var qidx = {
        "_id":"_design/status-dt",
        "language": "query",
        "views": {
          "status-dt-json-index": {
            "map": {
              "fields": {
                "status": "asc",
                "datetime": "asc"
              },
              "partial_filter_selector": {}
            },
            "reduce": "_count",
            "options": {
              "def": {
                "fields": [
                  "status",
                  "datetime"
                ]
              }
            }
          }
        }
    };

    var qidx2 = {
        "_id":"_design/datetime",
        "language": "query",
        "views": {
          "datetime-json-index": {
            "map": {
              "fields": {
                "datetime": "asc"
              },
              "partial_filter_selector": {}
            },
            "reduce": "_count",
            "options": {
              "def": {
                "fields": [
                  "datetime"
                ]
              }
            }
          }
        }
    }

    // Create an default tournament document
    var tournament_doc = {
        tournament: {
            name: "Turniername",
            location: "Ort",
            date: "Datum",
            url: "http://link-zur-auschreibung.de",
            description : "Turnierbeschreibung",
            capacity : "0",
            groups: ["Gruppe A"],
            entryfee: "10",
            paymentdeadline: "7",
            recipient: "Veranstalter",
            IBAN: "DE"
        }
    };

    // Create an initial default administrator
    var root_doc = {
        userid:"root",
        password:"root",    // FIX me: hash password
        level:"root"
    }
    
    var docs = [];
    docs.push(dbview);
    docs.push(qidx);
    docs.push(qidx2);
    if (createInitialContent) {
        docs.push(tournament_doc);
        docs.push(root_doc);
    }

    db.bulk({ docs:docs }, function(err) {
        if (err) console.log(err); else console.log("Initial DB content created");
        callback();
    }); 

    /*
    db.insert(dbview, function (err, result) {
      if (err) { throw err; }
      console.log('Index for Player and Club Counting created');

      db.insert(qidx, function (err, result) {
        if (err) { throw err; }
        console.log('Index for Status and Datetime Queries created');

        db.insert(qidx2, function (err, result) {
            if (err) { throw err; }
            console.log('Index for Datetime Queries created');

            if (createInitialContent) {
                db.insert(tournament_doc, function (err, result) {
                    console.log("Default Tournament Document created");
        
                    db.insert(root_doc,  function (err, result) {
                        console.log("Default Administrator <root:root> created! Please change userid and password");
                        callback();
                    });   
                });
            } else callback();
        });
      });
    });
    */
}
