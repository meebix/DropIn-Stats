// ############################
// ##-  Message Totals Statistics  -##
// ###########################
'use strict';

// Required tables: Bars, UserMessages, BarPromotions, UserBars

// Requires
var Parse = require('parse').Parse;
var _ = require('underscore');
var moment = require('moment');

// Parse Keys
Parse.initialize(process.env.PARSE_ID, process.env.PARSE_SECRET);

// Create new objects
var Bars = Parse.Object.extend('Bars');
var UserMessages = Parse.Object.extend('UserMessages');
var UserBars = Parse.Object.extend('UserBars');
var BarPromotions = Parse.Object.extend('BarPromotions');
var MessageTotals = Parse.Object.extend('MessageTotals');

// Instantiate queries
var barsQuery = new Parse.Query(Bars);
var userMessagesQuery = new Parse.Query(UserMessages);
var userBarsQuery = new Parse.Query(UserBars);
var barPromotionsQuery = new Parse.Query(BarPromotions);
var messageTotalStatsQuery = new Parse.Query(MessageTotals);

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

  barPromotionsQuery.equalTo('barObjId', bar);
  barPromotionsQuery.find()
  .then(function(results) {
    // 1. Amount of messages sent per bar
    var messagesCount = 0;
    // Holds expire dates from BarPromotions for comparison below
    // Did this here to prevent having to make a query request to barPromotions twice
    var expireDates = [];

    _.each(results, function(obj) {
      messagesCount += obj.attributes.numberOfMessagesSent;

      expireDates.push(moment(obj.attributes.promotionExpiryDate).format('MM-DD-YYYY'));
    });

    // Calculated stats object
    var stats = {
      sent: messagesCount
    };

    // Added to carry any reference data (non-calculated data) across Promises
    var references = {
      expireDates: expireDates
    };

    data.stats = stats;
    data.references = references;
  })
  .then(function() {
    userMessagesQuery.equalTo('barObjId', bar);
    return userMessagesQuery.find()
      .then(function(results) {
        // 2. Number of messages read by the user per bar
        var messagesRead = 0;
        // Holds users who read any message from bar in UserMessages for comparison below
        // Did this here to prevent having to make a query request to userMessages twice
        var usersWhoRead = [];

        _.each(results, function(obj) {
          var read = obj.attributes.messageRead;
          var user = obj.attributes.appUser.id;

          if (read) {
            messagesRead++;

            usersWhoRead.push(user);
          }
        });

        data.stats.read = messagesRead;
        // The user read "a" message from this bar and came in on the day of "a" promotion
        // This is totals, so no specifics on is a user read a specific message and came to the bar
        data.references.usersWhoRead = usersWhoRead;
      });
  })
  .then(function() {
    // 3. Number of users who visited due to message per bar
    var visitCount = 0;

    userBarsQuery.equalTo('barObjID', bar);
    return userBarsQuery.find()
      .then(function(userBars) {
        _.each(userBars, function(obj) {
          var lastVisit = obj.attributes.lastVisit !== undefined ? moment(obj.attributes.lastVisit).format('MM-DD-YYYY') : null;
          var user = obj.attributes.appUser.id;

          if (_.contains(data.references.expireDates, lastVisit) && _.contains(data.references.usersWhoRead, user)) {
            visitCount++;
          }
        });

        data.stats.visits = visitCount;
      });
  })
  .then(function() {
    // Find bar object
    return barsQuery.get(bar);
  })
  .then(function(barObject) {
    // Late injection of full barObject for reference field
    // Needs to inject here to calculate stats correctly first
    data.stats.barObjId = barObject;

    messageTotalStatsQuery.equalTo('barObjId', barObject);
    return messageTotalStatsQuery.first().then(function(result) {
      // If bar already present, overwrite, else create new
      var model = result ? result : new MessageTotals();

      return model.save(data.stats, {
        success: function(newStat) {
          console.log('New message total stat object created with objectId: ' + newStat.id);
        },
        error: function(newStat, error) {
          console.log('Failed to create new message total stat object, with error code: ' + error.message);
        }
      });
    });
  });
}
