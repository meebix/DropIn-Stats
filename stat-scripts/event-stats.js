// ####################
// ##-  Event Statistics  -##
// ####################
'use strict';

// Required tables: Bar, Users_Bar_Algo, Stats_Users

// Requires
var Parse = require('parse').Parse;
var _ = require('underscore');
var moment = require('moment');

// Parse Keys
Parse.initialize(process.env.PARSE_ID, process.env.PARSE_SECRET);

// Create new objects
var Events = Parse.Object.extend('Events');
var UsersEvents = Parse.Object.extend('Users_Events');
var Algo = Parse.Object.extend('Users_Bar_Algo');
var StatsEvents = Parse.Object.extend('Stats_Events');

// Instantiate queries
var eventsQuery = new Parse.Query(Events);
var usersEventsQuery = new Parse.Query(UsersEvents);
var algoQuery = new Parse.Query(Algo);

// Main iteration
eventsQuery
.each(function(eventObj) {
  calcStats(eventObj);
});

// Main function
function calcStats(eventObj) {
  // Initialize master object to carry state of calculations through promises
  var data = {};

  // Stat Calculations
  var totalUsersSentTo = 0;

  usersEventsQuery.equalTo('eventId', eventObj);
  usersEventsQuery.include('eventId.userId.barId');
  usersEventsQuery.find().then(function(results) {
    totalUsersSentTo = results.length;

    var stats = {
      calcDate: new Date(),
      eventId: eventObj,
      totalUsersSentTo: totalUsersSentTo,
      totalCreditsEarned: 0
    };

    data.stats = stats;
    return results;
  })
  .then(function(results) {
    var todaysEvents = _.filter(results, function(obj) {
      var todaysDate = moment(new Date()).format('MM-DD-YYYY');
      var eventDate = moment(obj.attributes.date).format('MM-DD-YYYY');

      if (obj.attributes.date !== undefined && eventDate === todaysDate) {
        return obj;
      }
    });

    // For each of the results, get the userId.id and plug that into the Algo table
    var algoObjs = [];

    var promise = Parse.Promise.as();
    _.each(todaysEvents, function(obj) {
      promise = promise.then(function() {
        algoQuery.equalTo('userId', obj.attributes.userId);
        return algoQuery.find().then(function(algoObj) {
          algoObjs.push(algoObj);
        });
      });
    });

    data.algoObjs = algoObjs;
    return promise;
  })
  .then(function() {
    _.each(data.algoObjs, function(obj) {
      _.each(obj, function(result) {
        var todaysDate = moment(new Date()).format('MM-DD-YYYY');
        var lastCreditEarnedDate = result.attributes.lastCreditEarned !== undefined ? moment(result.attributes.lastCreditEarned).format('MM-DD-YYYY') : 0;

        if (lastCreditEarnedDate === todaysDate) {
          data.stats.totalCreditsEarned++;
        }
      });
    });
  })
  .then(function() {
    var newStat = new StatsEvents();

    newStat.save(data.stats).then(function() {
      // success
      console.log('saved!');
    }, function(error) {
      console.log(error);
    });
  });
}
