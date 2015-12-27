// #####################
// ##-  Traffic Statistics  -##
// ####################
'use strict';

// Required tables: Bars, UserBars

// Requires
var Parse = require('parse').Parse;
var _ = require('underscore');
var moment = require('moment');

// Parse Keys
Parse.initialize(process.env.PARSE_ID, process.env.PARSE_SECRET);

// Create new objects
var Bars = Parse.Object.extend('Bars');
var UserBars = Parse.Object.extend('UserBars');
var TrafficStats = Parse.Object.extend('TrafficStats');

// Instantiate queries
var barsQuery = new Parse.Query(Bars);
var userBarsQuery = new Parse.Query(UserBars);
var trafficStatsQuery = new Parse.Query(TrafficStats);

// Main iteration
// Loops through each bar object
barsQuery
.each(function(bar) {
  calcStats(bar.id);
});

// Main function
function calcStats(bar) {
  // Initialize master object to carry state of calculations through promises
  var data = {};

  // Stat Calculations
  userBarsQuery.equalTo('barObjID', bar);
  userBarsQuery.find()
  .then(function(results) {
    var visitCount = 0;
    var todaysDate = moment(new Date()).format('MM-DD-YYYY');

    _.each(results, function(obj) {
      var lastVisit = obj.attributes.lastVisit;
      var lastVisitDate = lastVisit ? moment(obj.attributes.lastVisit).format('MM-DD-YYYY') : 0;

      if (todaysDate === lastVisitDate) visitCount++;
    });

    // Calculated stats object
    var stats = {
      date: new Date(),
      totalVisits: visitCount
    };

    data.stats = stats;
  })
  .then(function() {
    // Find bar object
    return barsQuery.get(bar);
  })
  .then(function(barObject) {
    // Late injection of full barObject for reference field
    // Needs to inject here to calculate stats correctly first
    data.stats.barObjId = barObject;

    trafficStatsQuery.equalTo('barObjId', barObject);
    return trafficStatsQuery.first().then(function(result) {
      // If bar already present, overwrite, else create new
      var model = result ? result : new TrafficStats();

      return model.save(data.stats, {
        success: function(newStat) {
          console.log('New traffic stat object created with objectId: ' + newStat.id);
        },
        error: function(newStat, error) {
          console.log('Failed to create new traffic stat object, with error code: ' + error.message);
        }
      });
    });
  });
}
