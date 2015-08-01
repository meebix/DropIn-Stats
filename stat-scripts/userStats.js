// ###################
// ##-  User Statistics  -##
// ###################
'use strict';

// Required tables: Bars, UserBars, UserStats

// Requires
var Parse = require('parse').Parse;
var _ = require('underscore');
var moment = require('moment');

// Parse Keys
Parse.initialize(process.env.PARSE_ID, process.env.PARSE_SECRET);

// Create new objects
var Bars = Parse.Object.extend('Bars');
var UserBars = Parse.Object.extend('UserBars');
var UserStats = Parse.Object.extend('UserStats');

// Instantiate queries
var barsQuery = new Parse.Query(Bars);
var userBarsQuery = new Parse.Query(UserBars);
var userStatsQuery = new Parse.Query(UserStats);

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
  userBarsQuery.include('appUser');
  return userBarsQuery.find()
    .then(function(userBar) {
      var results = [];

      // Get attributes hash for each result returned
      // Makes attribute lookup easier
       _.each(userBar, function(obj) {
        results.push(obj.attributes);
      });

      return results;
  })
  .then(function(results) {
    // 1. Number of registered users per bar
    var registeredUsers = results.length;

    // 2. Number of active users per bar
    var activeUsers = 0;
    var activeMales = 0;
    var activeFemales = 0;

    var newDate = new Date();
    var activeDate = newDate.setDate(newDate.getDate() - 30);

    var withLastDate = _.filter(results, function(obj) {
      if (obj.lastVisit !== undefined) {
        return obj;
      }
    });

    _.each(withLastDate, function(obj) {
      var userObj = obj.appUser.attributes;

      if (obj.lastVisit > activeDate) {
        activeUsers++;
      }

      if (userObj.gender === 'XY') activeMales++;
      if (userObj.gender === 'XX') activeFemales++;
    });

    // 3. Breakdown of age group of all users per bar
    var age35_plus = 0;
    var age30_34 = 0;
    var age25_29 = 0;
    var age21_24 = 0;

    var dateGt35 = moment(new Date()).subtract(35, 'years');
    var dateGt30 = moment(new Date()).subtract(30, 'years');
    var dateGt25 = moment(new Date()).subtract(25, 'years');

    _.each(results, function(obj) {
      var userObj = obj.appUser.attributes;
      var dob = moment(userObj.dob);

      if (dob.isBefore(dateGt35)) {
        age35_plus++;
      } else if (dob.isBefore(dateGt30)) {
        age30_34++;
      } else if (dob.isBefore(dateGt25)) {
        age25_29++;
      } else {
        age21_24++;
      }
    });

    // 4. Number of status types of all users per bar
    var vip = 0;
    var regular = 0;
    var guest = 0;

    _.each(results, function(obj) {
      var userStatus = obj.statusColor.toLowerCase();

      if (userStatus === 'vip') {
        vip++;
      } else if (userStatus === 'regular') {
        regular++;
      } else {
        guest++;
      }
    });

    // Calculated stats object
    var stats = {
      registeredUsers: registeredUsers,
      activeUsers: activeUsers,
      activeMales: activeMales,
      activeFemales: activeFemales,
      age21_24: age21_24,
      age25_29: age25_29,
      age30_34: age30_34,
      age35_plus: age35_plus,
      vip: vip,
      regular: regular,
      guest: guest
    };

    // Put calculated stats object into master data object for carry through
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

    userStatsQuery.equalTo('barObjId', barObject);
    return userStatsQuery.first().then(function(result) {
      // If bar already present, overwrite, else create new
      var model = result ? result : new UserStats();

      return model.save(data.stats, {
        success: function(newStat) {
          console.log('New user stat object created with objectId: ' + newStat.id);
        },
        error: function(newStat, error) {
          console.log('Failed to create new user stat object, with error code: ' + error.message);
        }
      });
    });
  });
}
