// Users Groups Table Dump

var Parse = require('parse').Parse;
var json2csv = require('json2csv');
var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');
var env = require('../environments');

// Parse Keys
Parse.initialize(env.PARSE_ID, env.PARSE_SECRET);

var UsersGroups = Parse.Object.extend('Users_Groups');

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
  'promoGroup',
  'score',
  'tag',
  'userId',
  'createdAt',
  'updatedAt'
];

// Filename
if (env.ENV === 'production') {
  filename = 'users-groups-table.csv';
} else {
  filename = 'uat-users-groups-table.csv';
}

// Query
var usersGroupsQuery = new Parse.Query(UsersGroups);
usersGroupsQuery.count().then(function(totalRows) {
  total = totalRows;
  iterations = Math.ceil(total / 1000);
})
.then(function() {
  var usersGroupsQuery = new Parse.Query(UsersGroups);

  var promise = Parse.Promise.as();
  _.times(iterations, function() {
    promise = promise.then(function() {
      var count = 0;

      usersGroupsQuery.descending('objectId');
      usersGroupsQuery.limit(1000);
      if (!firstRun) usersGroupsQuery.lessThan('objectId', objectId);
      return usersGroupsQuery.find().then(function(results) {
        _.each(results, function(obj) {
          count = count + 1;

          if (count === 1000) {
            objectId = obj.id;
          }

          var formattedObj = {
            objectId: obj.id,
            barId: obj.attributes.barId ? obj.attributes.barId.id : null,
            date: obj.attributes.date ? obj.attributes.date.toISOString() : null,
            promoGroup: obj.attributes.promoGroup ? obj.attributes.promoGroup : null,
            score: obj.attributes.score ? obj.attributes.score : null,
            tag: obj.attributes.tag ? obj.attributes.tag : null,
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
