// ############################
// ##-  Message Totals Statistics  -##
// ###########################
'use strict';

// Required tables: Bars, UserMessages

// Requires
var Parse = require('parse').Parse;
var _ = require('underscore');

// Parse Keys
Parse.initialize(process.env.PARSE_ID, process.env.PARSE_SECRET);

// Create new objects
var Bars = Parse.Object.extend('Bars');
var UserMessages = Parse.Object.extend('UserMessages');
var MessageTotals = Parse.Object.extend('MessageTotals');

// Instantiate queries
var barsQuery = new Parse.Query(Bars);
var userMessagesQuery = new Parse.Query(UserMessages);
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

  // Stat Calculations
  userMessagesQuery.equalTo('barObjId', bar);
  userMessagesQuery.find()
  .then(function(results) {
    // 1. Amount of messages sent per bar
    var messagesSent = results.length;

    // 2. Number of messages read by the user per bar
    // 3. Number of users who visited due to message per bar
    var messagesRead = 0;
    var userVisits = 0;

    _.each(results, function(obj) {
      var read = obj.attributes.messageRead;
      var visited = obj.attributes.redeemed;

      if (read) messagesRead++;
      if (visited) userVisits++;
    });

    // Calculated stats object
    var stats = {
      sent: messagesSent,
      read: messagesRead,
      visits: userVisits
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

    messageTotalStatsQuery.equalTo('barObjId', barObject);
    return messageTotalStatsQuery.first().then(function(result) {
      // If bar already present, overwrite, else create new
      var model = result ? result : new MessageTotals();

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
