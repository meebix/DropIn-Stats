// ####################
// ##-  Traffic Statistics  -##
// ####################
'use strict';

// Required tables: Bar, Users_Bar_Algo, Stats_Traffic

// Requires
var Parse = require('parse').Parse;
var _ = require('underscore');
var moment = require('moment');

// Parse Keys
Parse.initialize(process.env.PARSE_ID, process.env.PARSE_SECRET);

// Create new objects
var Bar = Parse.Object.extend('Bar');
var StatsTraffic = Parse.Object.extend('Stats_Traffic');
var Timeline = Parse.Object.extend('Users_Timeline');

// Instantiate queries
var barQuery = new Parse.Query(Bar);
var timelineQuery = new Parse.Query(Timeline);

// Main iteration
barQuery
.each(function(bar) {
  calcStats(bar);
});

// Main function
function calcStats(bar) {
  // Initialize master object to carry state of calculations through promises
  var data = {};

  // Stat Calculations
  timelineQuery.equalTo('barId', bar);
  timelineQuery.include('userId');
  timelineQuery.limit(1000);
  timelineQuery.find().then(function(timelineObjs) {
    var visitsByCredit = 0;

    var filterByEventType = _.filter(timelineObjs, function(obj) {
      if (obj.attributes.eventType === 'Credit Earned') {
        return obj;
      }
    });

    var startDay = moment().subtract(1, 'days').hours(9).minute(0).second(0).millisecond(0); // 9am yesterday UTC (4am EST)
    var endDay = moment().hours(9).minute(0).second(0).millisecond(0); // 9am today UTC (4am EST)

    _.each(filterByEventType, function(obj) {
      var creditEarnedDate = moment(obj.attributes.date);

      if (obj.attributes.date !== undefined && creditEarnedDate.isBetween(startDay, endDay)) {
        visitsByCredit++;
      }
    });

    var stats = {
      calcDate: new Date(), // Point in time date tracking
      barId: bar,
      visitsByCredit: visitsByCredit
    };

    data.stats = stats;
  })
  .then(function() {
    var newStat = new StatsTraffic();

    newStat.save(data.stats).then(function(savedObj) {
      // success
      console.log('Parse record with object ID: ' + savedObj.id + ' has been successfully created.');
    }, function(error) {
      // error
      console.log('An error has occured: ' + error);
    });
  });
}
