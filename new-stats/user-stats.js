// ###################
// ##-  User Statistics  -##
// ###################
'use strict';

var Parse = require('parse').Parse;
var _ = require('underscore');
var moment = require('moment');

// Parse Keys

// Create new objects
var Bar = Parse.Object.extend('Bar');
var StatsUsers = Parse.Object.extend('Stats_Users');
var Algo = Parse.Object.extend('Users_Bar_Algo');

// Main iteration
// barQuery
// .each(function(bar) {
//   calcStats(bar);
// });

calcStats();

// Functions
function calcStats(bar) {
  var algoQuery = new Parse.Query(Algo);

  var total;
  var iterations;
  var firstRun = true;
  var objectId = null;
  var tableData = [];

  algoQuery.count().then(function(totalRows) {
    total = totalRows;
    iterations = Math.ceil(total / 1000);
  })
  .then(function() {
    var barQuery = new Parse.Query(Bar);
    var algoQuery = new Parse.Query(Algo);
    console.log(total, iterations);

    var promise = Parse.Promise.as();
    barQuery.each(function(bar) {
      _.times(iterations, function() {
        promise = promise.then(function() {
          var count = 0;

          algoQuery.equalTo('barId', bar);
          algoQuery.include('userId.roleId');
          algoQuery.descending('objectId');
          algoQuery.limit(1000);
          if (!firstRun) algoQuery.lessThan('objectId', objectId);
          return algoQuery.find().then(function(results) {
            _.each(results, function(obj) {
              count = count + 1;

              if (count === 1000) {
                objectId = obj.id;
              }

              tableData.push(obj);
            });
          })
          .then(function() {
            firstRun = false;
          });
        });
      });
    });

    return promise;
  })
  .then(function() {
    // Data of entire table available here
    console.log(tableData.length);
  });
}

function athing(bar) {
  var algoQuery = new Parse.Query(Algo);

  // Initialize master object to carry state of calculations through promises
  var data = {};

  // Stat Calculations
  algoQuery.equalTo('barId', bar);
  algoQuery.include('userId.roleId');
  algoQuery.limit(1000);
  algoQuery.find().then(function(algoObjs) {
    var usersSeen = {};
    var activeUsersByCredit = 0;

    // Filter to get users whose lastCreditEarned was within the past 30 days (rolling)
    var hasEarnedCreditWithinLast30Days = _.filter(algoObjs, function(obj) {
      var date30DaysAgo = moment(new Date()).subtract(2, 'days');
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
