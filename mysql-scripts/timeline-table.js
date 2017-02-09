// Timeline Table Dump

var Parse = require('parse/node');
var json2csv = require('json2csv');
var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');
var env = require('../environments');

// Parse Keys
Parse.initialize(env.PARSE_ID);
Parse.serverURL = env.SERVER_URL;

var Timeline = Parse.Object.extend('Users_Timeline');

// Data Dump
var total;
var iterations;
var firstRun = true;
var objectId = null;
var tableData = [];
var filename;
var fields = [
  'objectId',
  'barId',
  'date',
  'event',
  'eventType',
  'userId',
  'createdAt',
  'updatedAt'
];

// Filename
if (env.ENV === 'production') {
  filename = 'timeline-table.csv';
} else {
  filename = 'uat-timeline-table.csv';
}

// Query
var timelineQuery = new Parse.Query(Timeline);
timelineQuery.count().then(function(totalRows) {
  total = totalRows;
  iterations = Math.ceil(total / 1000);
})
.then(function() {
  var timelineQuery = new Parse.Query(Timeline);

  var promise = Parse.Promise.as();
  _.times(iterations, function() {
    promise = promise.then(function() {
      var count = 0;

      timelineQuery.include('barId.userId');
      timelineQuery.descending('objectId');
      timelineQuery.limit(1000);
      if (!firstRun) timelineQuery.lessThan('objectId', objectId);
      return timelineQuery.find().then(function(results) {
        _.each(results, function(obj) {
          count = count + 1;

          if (count === 1000) {
            objectId = obj.id;
          }

          var formattedObj = {
            objectId: obj.id,
            barId: obj.attributes.barId ? obj.attributes.barId.id : null,
            date: obj.attributes.date ? obj.attributes.date.toISOString() : null,
            event: obj.attributes.event ? obj.attributes.event : null,
            eventType: obj.attributes.eventType ? obj.attributes.eventType : null,
            userId: obj.attributes.userId ? obj.attributes.userId.id : null,
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
