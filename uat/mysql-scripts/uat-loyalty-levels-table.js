// Loyalty Levels Table Dump
// UAT

var Parse = require('parse').Parse;
var json2csv = require('json2csv');
var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');
var env = require('../../environments');

// Parse Keys
Parse.initialize(env.PARSE_ID, env.PARSE_SECRET);

var LoyaltyLevels = Parse.Object.extend('Loyalty_Levels');

// Data Dump
var total;
var iterations;
var firstRun = true;
var objectId = null;
var tableData = [];
var filename = 'uat-loyalty-levels-table.csv';
var fields = [
  'objectId',
  'name',
  'createdAt',
  'updatedAt'
];

var loyaltyLevelQuery = new Parse.Query(LoyaltyLevels);
loyaltyLevelQuery.count().then(function(totalRows) {
  total = totalRows;
  iterations = Math.ceil(total / 1000);
})
.then(function() {
  var loyaltyLevelQuery = new Parse.Query(LoyaltyLevels);

  var promise = Parse.Promise.as();
  _.times(iterations, function() {
    promise = promise.then(function() {
      var count = 0;

      loyaltyLevelQuery.include('barId.userId');
      loyaltyLevelQuery.descending('objectId');
      loyaltyLevelQuery.limit(1000);
      if (!firstRun) loyaltyLevelQuery.lessThan('objectId', objectId);
      return loyaltyLevelQuery.find().then(function(results) {
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
    fs.writeFile('../../csv/' + filename, csv, function(err) {
      if (err) throw err;
      console.log('file saved');
    });
  });
});
