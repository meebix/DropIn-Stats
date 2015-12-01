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
var Algo = Parse.Object.extend('Users_Bar_Algo');

// Instantiate queries
var barQuery = new Parse.Query(Bar);
var algoQuery = new Parse.Query(Algo);

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
  algoQuery.equalTo('barId', bar);
  algoQuery.include('userId.roleId');
  algoQuery.find().then(function(algoObjs) {
    var visitsByCredit = 0;

    // Filter to get objects where lastCreditEarned equals today's date
    var earnedCreditToday = _.filter(algoObjs, function(obj) {
      var dateToday = moment(new Date()).format('MM-DD-YYYY');
      var lastCreditEarnedDate = moment(obj.attributes.lastCreditEarned).format('MM-DD-YYYY');

      if (obj.attributes.lastCreditEarned !== undefined && lastCreditEarnedDate === dateToday) {
        return obj;
      }
    });

    // Number of users who visited a bar today and earned a credit
    _.each(earnedCreditToday, function(result) {
      var userRole = result.attributes.userId.attributes.roleId.attributes.name.toLowerCase();

      if (userRole === 'user') {
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
