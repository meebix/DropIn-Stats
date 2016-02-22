// Users Table Dump
// UAT

var Parse = require('parse').Parse;
var json2csv = require('json2csv');
var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');

// Parse Keys
Parse.initialize(process.env.UAT_PARSE_ID, process.env.UAT_PARSE_SECRET);

var User = Parse.Object.extend('User');

// Data Dump
var total;
var iterations;
var firstRun = true;
var objectId = null;
var tableData = [];
var filename = 'uat-user-table.csv';
var fields = [
  'objectId',
  'username',
  'dob',
  'gender',
  'loyaltyLevelId',
  'roleId',
  'createdAt',
  'updatedAt'
];

var userQuery = new Parse.Query(User);
userQuery.count().then(function(totalRows) {
  total = totalRows;
  iterations = Math.ceil(total / 1000);
})
.then(function() {
  var userQuery = new Parse.Query(User);

  var promise = Parse.Promise.as();
  _.times(iterations, function() {
    promise = promise.then(function() {
      var count = 0;

      userQuery.include('loyaltyLevelId.roleId');
      userQuery.descending('objectId');
      userQuery.limit(1000);
      if (!firstRun) userQuery.lessThan('objectId', objectId);
      return userQuery.find().then(function(results) {
        _.each(results, function(obj) {
          count = count + 1;

          if (count === 1000) {
            objectId = obj.id;
          }

          var formattedObj = {
            objectId: obj.id,
            username: obj.attributes.username,
            dob: obj.attributes.dob ? obj.attributes.dob.toISOString() : null,
            gender: obj.attributes.gender ? obj.attributes.gender : null,
            loyaltyLevelId: obj.attributes.loyaltyLevelId? obj.attributes.loyaltyLevelId.id : null,
            roleId: obj.attributes.roleId ? obj.attributes.roleId.id : null,
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
