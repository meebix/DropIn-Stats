// ####################
// ##-  Event Statistics  -##
// ####################
'use strict';

// Required tables: Events, Users_Events, Users_Bar_Algo, Stats_Events
// TODO: Should only run analytics on NEW events, not every event each day

// Requires
var Parse = require('parse').Parse;
var _ = require('underscore');
var moment = require('moment');

// Parse Keys
Parse.initialize(process.env.PARSE_ID, process.env.PARSE_SECRET);

// Create new objects
var Events = Parse.Object.extend('Events');
var UsersEvents = Parse.Object.extend('Users_Events');
var Timeline = Parse.Object.extend('Users_Timeline');
var StatsEvents = Parse.Object.extend('Stats_Events');

// Instantiate queries
var eventsQuery = new Parse.Query(Events);
var usersEventsQuery = new Parse.Query(UsersEvents);
var timelineQuery = new Parse.Query(Timeline);

// // Main iteration
eventsQuery
.each(function(eventObj) {
  var startDay = moment().subtract(1, 'days').hours(9).minute(0).second(0).millisecond(0); // 9am yesterday UTC (4am EST)
  var endDay = moment().hours(9).minute(0).second(0).millisecond(0); // 9am today UTC (4am EST)
  var eventDate = moment(eventObj.attributes.eventEnd);

  if (eventDate.isBetween(startDay, endDay)) {
    calcStats(eventObj);
  }
});

// Main function
function calcStats(eventObj) {
  // Initialize master object to carry state of calculations through promises
  var data = {};

  usersEventsQuery.equalTo('eventId', eventObj);
  usersEventsQuery.include('userId.barId');
  return usersEventsQuery.find().then(function(usersEventObjs) {
    // Event ID
    var eventId = eventObj;

    // Bar ID
    var barId = usersEventObjs[0].attributes.barId;

    // Number of users event was sent to
    var usersSentTo = usersEventObjs.length;

    // Store event start and end date for use later
    data.eventStart = eventObj.attributes.eventStart;
    data.eventEnd = eventObj.attributes.eventEnd;

    // Collect user ids from population for comparison below
    data.userIds = [];
    _.each(usersEventObjs, function(obj) {
      var userId = obj.attributes.userId.id;

      data.userIds.push(userId);
    });

    var stats = {
      calcDate: new Date(),
      eventId: eventId,
      barId: barId,
      usersSentTo: usersSentTo
    };

    data.stats = stats;
    return usersEventObjs;
  })
  .then(function() {
    data.stats.creditsEarned = 0;

    timelineQuery.equalTo('eventType', 'Credit Earned');
    return timelineQuery.find().then(function(results) {
      var filterByBar = _.filter(results, function(obj) {
        if (obj.attributes.barId.id === data.stats.barId.id) {
          return obj;
        }
      });

      // Did any of the users the event was sent to match a user from this subset and is date between event date
      _.each(filterByBar, function(obj) {
        var userId = obj.attributes.userId.id;

        var entryDate = moment(obj.attributes.date);
        var eventStartDate = moment(data.eventStart);
        var eventEndDate = moment(data.eventEnd);

        // Testing
        // console.log(data.stats.eventId.id, data.stats.barId.id, eventStartDate._d, eventEndDate._d, obj.attributes.userId.id, entryDate._d, entryDate.isBetween(eventStartDate, eventEndDate), _.contains(data.userIds, userId));

        if (entryDate.isBetween(eventStartDate, eventEndDate) && _.contains(data.userIds, userId)) {
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
