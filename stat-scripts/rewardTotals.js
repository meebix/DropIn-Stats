// ###########################
// ##-  Reward Totals Statistics  -##
// ##########################
'use strict';

// Required tables: Bars, UserRewards

// Requires
var Parse = require('parse').Parse;
var _ = require('underscore');

// Parse Keys
Parse.initialize(process.env.PARSE_ID, process.env.PARSE_SECRET);

// Create new objects
var Bars = Parse.Object.extend('Bars');
var UserRewards = Parse.Object.extend('UserRewards');
var RewardTotals = Parse.Object.extend('RewardTotals');

// Instantiate queries
var barsQuery = new Parse.Query(Bars);
var userRewardsQuery = new Parse.Query(UserRewards);
var rewardTotalStatsQuery = new Parse.Query(RewardTotals);

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
  userRewardsQuery.equalTo('barObjID', bar);
  userRewardsQuery.find()
  .then(function(results) {
    // 1. Amount of rewards issued per bar
    var rewardsIssued = results.length;

    // 2. Amount of active outstanding rewards per bar
    // 3. Amount of redeemed rewards per bar
    var rewardsActive = 0;
    var rewardsRedeemed = 0;

    _.each(results, function(obj) {
      var isActive = obj.attributes.isActive;
      var wasRedeemed = obj.attributes.redeemedDate;

      if (isActive) rewardsActive++;
      if (wasRedeemed) rewardsRedeemed++;
    });

    // Calculated stats object
    var stats = {
      issued: rewardsIssued,
      active: rewardsActive,
      redeemed: rewardsRedeemed
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

    rewardTotalStatsQuery.equalTo('barObjId', barObject);
    return rewardTotalStatsQuery.first().then(function(result) {
      // If bar already present, overwrite, else create new
      var model = result ? result : new RewardTotals();

      return model.save(data.stats, {
        success: function(newStat) {
          console.log('New reward total stat object created with objectId: ' + newStat.id);
        },
        error: function(newStat, error) {
          console.log('Failed to create new reward total stat object, with error code: ' + error.message);
        }
      });
    });
  });
}
