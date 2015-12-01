// ####################
// ##-  Event Statistics  -##
// ####################
'use strict';

// Required tables: Events, Users_Events, Users_Bar_Algo, Stats_Events

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
  var usersSentTo = 0;

  usersEventsQuery.equalTo('eventId', eventObj);
  usersEventsQuery.include('eventId.userId.barId');
  usersEventsQuery.find().then(function(results) {
    // Number of users this event was sent to
    usersSentTo = results.length;

    var stats = {
      calcDate: new Date(),
      eventId: eventObj,
      usersSentTo: usersSentTo
    };

    data.stats = stats;
    return results;
  })
  .then(function(results) {
    // Get all events happening today
    var todaysEvents = _.filter(results, function(obj) {
      var todaysDate = moment(new Date()).format('MM-DD-YYYY');
      var eventDate = moment(obj.attributes.date).format('MM-DD-YYYY');

      if (obj.attributes.date !== undefined && eventDate === todaysDate) {
        return obj;
      }
    });

    // For each of the todaysEvents, get the userId.id and plug that into the Algo table
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
    // Initialize variable on data.stats object
    data.stats.creditsEarned = 0;

    // Number of credits earned on the event date
    _.each(data.algoObjs, function(obj) {
      _.each(obj, function(result) {
        var todaysDate = moment(new Date()).format('MM-DD-YYYY');
        var lastCreditEarnedDate = result.attributes.lastCreditEarned !== undefined ? moment(result.attributes.lastCreditEarned).format('MM-DD-YYYY') : 0;

        // If a user earned a credit on the day of the event, increment the count to be saved to the DB
        // data.algoObjs contains only events that are happenin today
        // Therefore we reaffirm that the lastCreditEarnedDate is indeed todaysDate
        if (lastCreditEarnedDate === todaysDate) {
          data.stats.creditsEarned++;
        }
      });
    });
  })
  .then(function() {
    var newStat = new StatsEvents();

    newStat.save(data.stats).then(function(savedObj) {
      // success
      console.log('Parse record with object ID: ' + savedObj.id + ' has been successfully created.');
    }, function(error) {
      // error
      console.log('An error has occured: ' + error);
    });
  });
}
