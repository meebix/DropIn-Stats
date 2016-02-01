// Role Table Dump
//

var Parse = require('parse').Parse;
var json2csv = require('json2csv');
var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');

// Parse Keys
Parse.initialize(process.env.PARSE_ID, process.env.PARSE_SECRET);

var Role = Parse.Object.extend('Role');

// Data Dump
var total;
var iterations;
var firstRun = true;
var objectId = null;
var tableData = [];
var filename = 'role-table.csv';
var fields = [
  'objectId',
  'name',
  'createdAt',
  'updatedAt'
];

var roleQuery = new Parse.Query(Role);
roleQuery.count().then(function(totalRows) {
  total = totalRows;
  iterations = Math.ceil(total / 1000);
})
.then(function() {
  var roleQuery = new Parse.Query(Role);
  console.log(total, iterations);

  var promise = Parse.Promise.as();
  _.times(iterations, function() {
    promise = promise.then(function() {
      var count = 0;

      roleQuery.include('barId.userId');
      roleQuery.descending('objectId');
      roleQuery.limit(1000);
      if (!firstRun) roleQuery.lessThan('objectId', objectId);
      return roleQuery.find().then(function(results) {
        _.each(results, function(obj) {
          count = count + 1;

          if (count === 1000) {
            objectId = obj.id;
          }

          var formattedObj = {
            objectId: obj.id,
            name: obj.attributes.name,
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
    fs.writeFile(filename, csv, function(err) {
      if (err) throw err;
      console.log('file saved');
    });
  });
});
