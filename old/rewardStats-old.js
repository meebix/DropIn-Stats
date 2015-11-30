// #####################
// ##-  Reward Statistics  -##
// #####################
'use strict';

// Required tables: Bars, BarPromotions, UserMessages
//
// bar promotions = all rewards this bar sent out, if reward attached; how many sent per reward
// user rewards = for this bar, for this reward id, how many redeemed (true);
//                              how many active (promotion date < now AND redeemed false)
//                              1 not redemeed 0 redeemed (if not redeemed, then its not active)
//                              if reward classification is other, that is the only one to run stats again

// Requires
var Parse = require('parse').Parse;
var _ = require('underscore');
var moment = require('moment');

// Parse Keys
Parse.initialize(process.env.PARSE_ID, process.env.PARSE_SECRET);

// Create new objects
var Bars = Parse.Object.extend('Bars');
var BarPromotions = Parse.Object.extend('BarPromotions');
var UserMessages = Parse.Object.extend('UserMessages');
var RewardStats = Parse.Object.extend('RewardStats');

// Instantiate queries
var barsQuery = new Parse.Query(Bars);
var barPromotionsQuery = new Parse.Query(BarPromotions);
var userMessagesQuery = new Parse.Query(UserMessages);
var rewardStatsQuery = new Parse.Query(RewardStats);

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
  barPromotionsQuery.equalTo('barObjId', bar);
  barPromotionsQuery.notEqualTo('rewardObjId', '-'); // Dash used instead of undefined or null
  barPromotionsQuery.find()
  .then(function(results) {
    var rewardsCount = 0;

    _.each(results, function(obj) {
      rewardsCount += obj.attributes.numberOfMessagesSent;
    });

    // Calculated stats object
    var stats = {
      issued: rewardsCount
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

    rewardStatsQuery.equalTo('barObjId', barObject);
    return rewardStatsQuery.first().then(function(result) {
      // If bar already present, overwrite, else create new
      var model = result ? result : new RewardStats();

      return model.save(data.stats, {
        success: function(newStat) {
          console.log('New reward stat object created with objectId: ' + newStat.id);
        },
        error: function(newStat, error) {
          console.log('Failed to create new reward stat object, with error code: ' + error.message);
        }
      });
    });
  });
}
