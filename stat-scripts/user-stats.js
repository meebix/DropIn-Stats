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
  var stats = {
    calcDate: new Date(), // Point in time date tracking
    barId: bar,
    activeUsersByCredit: 0
  };

  // Stat Calculations
  algoQuery.equalTo('barId', bar);
  algoQuery.include('userId.roleId');
  algoQuery.find().then(function(algoObjs) {

    var hasEarnedCreditWithinLast30Days = _.filter(algoObjs, function(obj) {
      var date30DaysAgo = moment(new Date()).subtract(30, 'days');
      var lastCreditEarnedDate = moment(obj.attributes.lastCreditEarned);

      if (obj.attributes.lastCreditEarned !== undefined && lastCreditEarnedDate.isAfter(date30DaysAgo)) {
        return obj;
      }
    });

    _.each(hasEarnedCreditWithinLast30Days, function(result) {
      var userRole = result.attributes.userId.attributes.roleId.attributes.name.toLowerCase();

      if (userRole === 'user') {
        stats.activeUsersByCredit++;
      }
    });
  })
  .then(function() {
    var newStat = new StatsUsers();

    newStat.save(stats).then(function() {
      // success
      console.log('saved!');
    }, function(error) {
      console.log(error);
    });
  });
}
