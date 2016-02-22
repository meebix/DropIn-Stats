// Users Events Table Dump
// UAT

var Parse = require('parse').Parse;
var json2csv = require('json2csv');
var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');

// Parse Keys
Parse.initialize(process.env.UAT_PARSE_ID, process.env.UAT_PARSE_SECRET);

var UsersEvents = Parse.Object.extend('Users_Events');

// Data Dump
var total;
var iterations;
var firstRun = true;
var objectId = null;
var tableData = [];
var filename = 'uat-users-events-table.csv';
var fields = [
  'objectId',
  'eventId',
  'userId',
  'barId',
  'userHasViewed',
  'markedForDeletion',
  'createdAt',
  'updatedAt'
];

var usersEventsQuery = new Parse.Query(UsersEvents);
usersEventsQuery.count().then(function(totalRows) {
  total = totalRows;
  iterations = Math.ceil(total / 1000);
})
.then(function() {
  var usersEventsQuery = new Parse.Query(UsersEvents);

  var promise = Parse.Promise.as();
  _.times(iterations, function() {
    promise = promise.then(function() {
      var count = 0;

      usersEventsQuery.include('barId.eventId.userId');
      usersEventsQuery.descending('objectId');
      usersEventsQuery.limit(1000);
      if (!firstRun) usersEventsQuery.lessThan('objectId', objectId);
      return usersEventsQuery.find().then(function(results) {
        _.each(results, function(obj) {
          count = count + 1;

          if (count === 1000) {
            objectId = obj.id;
          }

          var formattedObj = {
            objectId: obj.id,
            eventId: obj.attributes.eventId.id,
            userId: obj.attributes.userId.id,
            barId: obj.attributes.barId.id,
            userHasViewed: obj.attributes.userHasViewed,
            markedForDeletion: obj.attributes.markedForDeletion,
            createdAt: obj.createdAt.toISOString(),
            updatedAt: obj.updatedAt.toISOString()
          };

          tableData.push(formattedObj);
        });
      })
      .then(function() {
        firstRun = false;
      });
    });
  });

  return promise;
})
.then(function() {
  json2csv({ data: tableData, fields: fields }, function(err, csv) {
    if (err) console.log(err);
    fs.writeFile('../../csv/' + filename, csv, function(err) {
      if (err) throw err;
      console.log('file saved');
    });
  });
});
