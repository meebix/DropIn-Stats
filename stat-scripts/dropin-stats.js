// #####################
// ##-  DropIn Statistics  -##
// ####################
'use strict';

// Required tables: Role, User, Users_Bar_Algo, Stats_DropIn

// Requires
var Parse = require('parse').Parse;
var _ = require('underscore');
var moment = require('moment');

// Parse Keys
Parse.initialize(process.env.PARSE_ID, process.env.PARSE_SECRET);

// Create new objects
var Role = Parse.Object.extend('Role');
var StatsDropIn = Parse.Object.extend('Stats_DropIn');
var Algo = Parse.Object.extend('Users_Bar_Algo');
var UsersRewards = Parse.Object.extend('Users_Rewards');

// Instantiate queries
var roleQuery = new Parse.Query(Role);
var algoQuery = new Parse.Query(Algo);
var usersQuery = new Parse.Query(Parse.User);
var usersRewardsQuery = new Parse.Query(UsersRewards);

// Main iteration
calcStats();

// Main function
function calcStats() {
  // Initialize master object to carry state of calculations through promises
  var data = {};

  // Stat Calculations
  roleQuery.equalTo('name', 'User');
  roleQuery.first().then(function(role) {
    return role;
  })
  .then(function(role) {
    usersQuery.equalTo('roleId', role);
    usersQuery.include('loyaltyLevelId');
    return usersQuery.find().then(function(userObjs) {
      // Initialize variables for stats
      var totalMales = 0;
      var totalFemales = 0;
      var totalGuests = 0;
      var totalRegulars = 0;
      var totalVips = 0;
      var age35Plus = 0;
      var age3034 = 0;
      var age2529 = 0;
      var age2124 = 0;

      // Total number of Drop In users
      var totalUsers = userObjs.length;

      _.each(userObjs, function(user) {
        // Number of males and females
        var gender = user.attributes.gender.toLowerCase();

        if (gender === 'male') {
          totalMales++;
        } else if (gender === 'female') {
          totalFemales++;
        }

        // Number of users by loyalty level
        var loyaltyLevel = user.attributes.loyaltyLevelId.attributes.name.toLowerCase();

        if (loyaltyLevel === 'guest') {
          totalGuests++;
        } else if (loyaltyLevel === 'regular') {
          totalRegulars++;
        } else if (loyaltyLevel === 'vip') {
          totalVips++;
        }

        // Number of users by age
        var dateGt35 = moment(new Date()).subtract(35, 'years');
        var dateGt30 = moment(new Date()).subtract(30, 'years');
        var dateGt25 = moment(new Date()).subtract(25, 'years');
        var dateGt21 = moment(new Date()).subtract(21, 'years');

        var dob = moment(user.attributes.dob);

        if (dob.isBefore(dateGt35)) {
          age35Plus++;
        } else if (dob.isBefore(dateGt30)) {
          age3034++;
        } else if (dob.isBefore(dateGt25)) {
          age2529++;
        } else if (dob.isBefore(dateGt21)) {
          age2124++;
        }
      });

      var stats = {
        calcDate: new Date(), // Point in time date tracking
        totalUsers: totalUsers,
        totalMales: totalMales,
        totalFemales: totalFemales,
        totalGuests: totalGuests,
        totalRegulars: totalRegulars,
        totalVips: totalVips,
        age35Plus: age35Plus,
        age3034: age3034,
        age2529: age2529,
        age2124: age2124
      };

      data.stats = stats;
      return userObjs;
    })
    .then(function(userObjs) {
      // Initialize more variables on data.stats object
      data.stats.totalActiveUsersByCredit = 0;
      data.stats.totalTrafficByCredit = 0;

      var date30DaysAgo = moment(new Date()).subtract(30, 'days');
      var dateToday = moment(new Date()).format('MM-DD-YYYY');

      var promise = Parse.Promise.as();
      _.each(userObjs, function(user) {
        var activeUserCreditCount = 0;
        // var trafficCreditCount = 0;

        promise = promise.then(function() {
          algoQuery.equalTo('userId', user);
          return algoQuery.find().then(function(results) {
            _.each(results, function(result) {
              var lastCreditDate = moment(result.attributes.lastCreditEarned);
              var lastCreditDateFormatted = moment(result.attributes.lastCreditEarned).format('MM-DD-YYYY');

              // Increase the active user count for any user who has visited any bar within the last 30 days
              if (result.attributes.lastCreditEarned !== undefined && lastCreditDate.isAfter(date30DaysAgo)) {
                activeUserCreditCount++;
              }

              // Increase the traffic count for any user who visited any bar on today's date
              if (result.attributes.lastCreditEarned !== undefined && lastCreditDateFormatted === dateToday) {
                // trafficCreditCount++;
                data.stats.totalTrafficByCredit++;
              }
            });

            // Increment counts on data.stats object to be saved to the DB
            if (activeUserCreditCount > 0) {
              data.stats.totalActiveUsersByCredit++;
            }

            // if (trafficCreditCount > 0) {
            //   data.stats.totalTrafficByCredit++;
            // }
          });
        });
      });

      return promise;
    })
    .then(function() {
      var dateToday = moment(new Date()).format('MM-DD-YYYY');

      // Number of redeemed rewards
      data.stats.totalRewardsRedeemed = 0;

      var promise = Parse.Promise.as();
      return usersRewardsQuery.find().then(function(results) {
        _.each(results, function(obj) {
          promise = promise.then(function() {
            var userHasRedeemed = obj.attributes.userHasRedeemed;
            var redeemedOnDate = moment(obj.attributes.redeemedOnDate).format('MM-DD-YYYY');

            // If a user has redeemed a reward, increase the count of the data.stats object to be saved to the DB
            if (userHasRedeemed && redeemedOnDate === dateToday) {
              data.stats.totalRewardsRedeemed++;
            }
          });
        });

        return promise;
      });
    })
    .then(function() {
      var newStat = new StatsDropIn();

      newStat.save(data.stats).then(function(savedObj) {
        // success
        console.log('Parse record with object ID: ' + savedObj.id + ' has been successfully created.');
      }, function(error) {
        // error
        console.log('An error has occured: ' + error);
      });
    });
  });
}
