// Session Table Dump

var Parse = require('parse').Parse;
var json2csv = require('json2csv');
var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');
var env = require('../environments');

// Parse Keys
Parse.initialize(env.PARSE_ID, env.PARSE_SECRET);

var Session = Parse.Object.extend('Session');

// Data Dump
var total;
var iterations;
var firstRun = true;
var objectId = null;
var tableData = [];
var filename;
var fields = [
  'objectId',
  'createdWith',
  'expiresAt',
  'installationId',
  'restricted',
  'sessionToken',
  'userId',
  'createdAt',
  'updatedAt'
];

// Filename
if (env.ENV === 'production') {
  filename = 'session-table.csv';
} else {
  filename = 'uat-session-table.csv';
}

// Query
var sessionQuery = new Parse.Query(Session);
sessionQuery.count().then(function(totalRows) {
  total = totalRows;
  iterations = Math.ceil(total / 1000);
})
.then(function() {
  var sessionQuery = new Parse.Query(Session);

  var promise = Parse.Promise.as();
  _.times(iterations, function() {
    promise = promise.then(function() {
      var count = 0;

      sessionQuery.descending('objectId');
      sessionQuery.limit(1000);
      if (!firstRun) sessionQuery.lessThan('objectId', objectId);
      return sessionQuery.find().then(function(results) {
        _.each(results, function(obj) {
          count = count + 1;

          if (count === 1000) {
            objectId = obj.id;
          }

          var formattedObj = {
            objectId: obj.id,
            createdWith: obj.attributes.createdWith ? obj.attributes.createdWith : null,
            expiresAt: obj.attributes.expiresAt ? obj.attributes.expiresAt.toISOString() : null,
            installationId: obj.attributes.installationId ? obj.attributes.installationId : null,
            restricted: obj.attributes.restricted ? obj.attributes.restricted : null,
            sessionToken: obj.attributes.sessionToken ? obj.attributes.sessionToken : null,
            userId: obj.attributes.userId ? obj.attributes.userId : null,
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
