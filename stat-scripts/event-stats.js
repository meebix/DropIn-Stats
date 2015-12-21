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
    // Get and set bar ids
    var barIds = [];

    _.each(results, function(result) {
      barIds.push(result.attributes.barId);
    });

    var barId = barIds[0];
    data.stats.barId = barId;

    // Get the event start and end dates
    data.events = [];

    _.each(results, function(result) {
      data.events.push([result.attributes.eventStart, result.attributes.eventEnd]);
    });

    return results;
  })
  .then(function(results) {
    // Get all events happening today
    var todaysEvents = _.filter(results, function(obj) {
      var todaysDate = moment(new Date()).format('MM-DD-YYYY');
      var eventDate = moment(obj.attributes.eventStart).format('MM-DD-YYYY');

      if (obj.attributes.eventStart !== undefined && eventDate === todaysDate) {
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
    // console.log(data.events);
    // Number of credits earned on the event date
    _.each(data.algoObjs, function(obj) {
      _.each(obj, function(result) {
        var eventStartDate = moment(data.events[0][0]);
        var eventEndDate = moment(data.events[0][1]);
        var lastCreditEarnedDate = moment(result.attributes.lastCreditEarned);

        // data.algoObjs contains only events that are happening today
        // If the last credit earned date AND time is between the event start and end date/time, increment count
        if (lastCreditEarnedDate.isBetween(eventStartDate, eventEndDate)) {
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
