// Events Table Dump

var Parse = require('parse').Parse;
var json2csv = require('json2csv');
var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');
var env = require('../environments');

// Parse Keys
Parse.initialize(env.PARSE_ID, env.PARSE_SECRET);

var Events = Parse.Object.extend('Events');

// Data Dump
var total;
var iterations;
var firstRun = true;
var objectId = null;
var tableData = [];
var filename;
var fields = [
  'objectId',
  'name',
  'description',
  'barId',
  'loyaltyLevelId',
  'photo',
  'eventStart',
  'eventEnd',
  'markedForDeletion',
  'createdAt',
  'updatedAt'
];

// Filename
if (env.ENV === 'production') {
  filename = 'events-table.csv';
} else {
  filename = 'uat-events-table.csv';
}

// Query
var eventsQuery = new Parse.Query(Events);
eventsQuery.count().then(function(totalRows) {
  total = totalRows;
  iterations = Math.ceil(total / 1000);
})
.then(function() {
  var eventsQuery = new Parse.Query(Events);

  var promise = Parse.Promise.as();
  _.times(iterations, function() {
    promise = promise.then(function() {
      var count = 0;

      eventsQuery.include('barId.userId');
      eventsQuery.descending('objectId');
      eventsQuery.limit(1000);
      if (!firstRun) eventsQuery.lessThan('objectId', objectId);
      return eventsQuery.find().then(function(results) {
        _.each(results, function(obj) {
          count = count + 1;

          if (count === 1000) {
            objectId = obj.id;
          }

          var formattedObj = {
            objectId: obj.id,
            name: obj.attributes.name ? obj.attributes.name : null,
            description: obj.attributes.description ? obj.attributes.description : null,
            barId: obj.attributes.barId ? obj.attributes.barId.id : null,
            loyaltyLevelId: obj.attributes.loyaltyLevelId ? obj.attributes.loyaltyLevelId.id : null,
            photo: obj.attributes.photo ? obj.attributes.photo._url : null,
            eventStart: obj.attributes.eventStart ? obj.attributes.eventStart.toISOString() : null,
            eventEnd: obj.attributes.eventEnd ? obj.attributes.eventEnd.toISOString() : null,
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
    fs.writeFile('../csv/' + filename, csv, function(err) {
      if (err) throw err;
      console.log('file saved');
    });
  });
});
