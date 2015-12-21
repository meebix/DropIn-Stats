// ###################
// ##-  User Statistics  -##
// ###################
'use strict';

// Required tables: Bar, Users_Bar_Algo, Stats_Users
// TODO: Don't save bars that have no active users

// Requires
var Parse = require('parse').Parse;
var _ = require('underscore');
var moment = require('moment');

// Parse Keys
Parse.initialize(process.env.PARSE_ID, process.env.PARSE_SECRET);

// Create new objects
var Bar = Parse.Object.extend('Bar');
var StatsUsers = Parse.Object.extend('Stats_Users');
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
    var usersSeen = {};
    var activeUsersByCredit = 0;

    // Filter to get users whose lastCreditEarned was within the past 30 days (rolling)
    var hasEarnedCreditWithinLast30Days = _.filter(algoObjs, function(obj) {
      var date30DaysAgo = moment(new Date()).subtract(30, 'days');
      var lastCreditEarnedDate = moment(obj.attributes.lastCreditEarned);

      if (obj.attributes.lastCreditEarned !== undefined && lastCreditEarnedDate.isAfter(date30DaysAgo)) {
        return obj;
      }
    });

    // Number of active users by credit earned
    _.each(hasEarnedCreditWithinLast30Days, function(result) {
      var userId = result.attributes.userId.id;

      // Capture unique users
      if (usersSeen.hasOwnProperty(userId)) {
        usersSeen[userId] += 1;
      } else {
        usersSeen[userId] = 0;
      }
    });

    // Count unique users and increment credit count
    for (var id in usersSeen) {
      activeUsersByCredit++;
    }

    var stats = {
      calcDate: new Date(), // Point in time date tracking
      barId: bar,
      activeUsersByCredit: activeUsersByCredit
    };

    data.stats = stats;
  })
  .then(function() {
    var newStat = new StatsUsers();

    newStat.save(data.stats).then(function(savedObj) {
      // success
      console.log('Parse record with object ID: ' + savedObj.id + ' has been successfully created.');
    }, function(error) {
      // error
      console.log('An error has occured: ' + error);
    });
  });
}
