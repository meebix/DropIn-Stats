// Users Bar Algo Timeline Table Dump

var Parse = require('parse').Parse;
var json2csv = require('json2csv');
var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');
var env = require('../environments');

// Parse Keys
Parse.initialize(env.PARSE_ID, env.PARSE_SECRET);

var UsersBarAlgoTimeline = Parse.Object.extend('Users_Bar_Algo_Timeline');

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
  'excludeRecord',
  'timeSpent',
  'userId',
  'createdAt',
  'updatedAt'
];

// Filename
if (env.ENV === 'production') {
  filename = 'users-bar-algo-timeline-table.csv';
} else {
  filename = 'uat-users-bar-algo-timeline-table.csv';
}

// Query
var usersBarAlgoTimelineQuery = new Parse.Query(UsersBarAlgoTimeline);
usersBarAlgoTimelineQuery.count().then(function(totalRows) {
  total = totalRows;
  iterations = Math.ceil(total / 1000);
})
.then(function() {
  var usersBarAlgoTimelineQuery = new Parse.Query(UsersBarAlgoTimeline);

  var promise = Parse.Promise.as();
  _.times(iterations, function() {
    promise = promise.then(function() {
      var count = 0;

      usersBarAlgoTimelineQuery.include('barId.userId');
      usersBarAlgoTimelineQuery.descending('objectId');
      usersBarAlgoTimelineQuery.limit(1000);
      if (!firstRun) usersBarAlgoTimelineQuery.lessThan('objectId', objectId);
      return usersBarAlgoTimelineQuery.find().then(function(results) {
        _.each(results, function(obj) {
          count = count + 1;

          if (count === 1000) {
            objectId = obj.id;
          }

          var formattedObj = {
            objectId: obj.id,
            date: obj.attributes.date ? obj.attributes.date.toISOString() : null,
            event: obj.attributes.event ? obj.attributes.event : null,
            excludeRecord: obj.attributes.excludeRecord ? obj.attributes.excludeRecord : null,
            timeSpent: obj.attributes.timeSpent ? obj.attributes.timeSpent : null,
            barId: obj.attributes.barId ? obj.attributes.barId.id : null,
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
