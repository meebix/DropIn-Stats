// Users Bar Algo Table Dump

var Parse = require('parse').Parse;
var json2csv = require('json2csv');
var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');
var env = require('../environments');

// Parse Keys
Parse.initialize(env.PARSE_ID, env.PARSE_SECRET);

var UsersBarAlgo = Parse.Object.extend('Users_Bar_Algo');

// Data Dump
var total;
var iterations;
var firstRun = true;
var objectId = null;
var tableData = [];
var filename;
var fields = [
  'objectId',
  'activeBar',
  // 'barObjIdString' // Not using because the barId is converted to a string, this is not necessary for SQL
  'barSubsequentEntry',
  'initialValuesUpdated',
  'lastCreditEarned',
  'lastVisit',
  'lockOutEndTime',
  'numberOfVisits',
  'sessionEndTime',
  'sessionStartTime',
  'timeSpent',
  'barId',
  'userId',
  'createdAt',
  'updatedAt'
];

// Filename
if (env.ENV === 'production') {
  filename = 'users-bar-algo-table.csv';
} else {
  filename = 'uat-users-bar-algo-table.csv';
}

// Query
var usersBarAlgoQuery = new Parse.Query(UsersBarAlgo);
usersBarAlgoQuery.count().then(function(totalRows) {
  total = totalRows;
  iterations = Math.ceil(total / 1000);
})
.then(function() {
  var usersBarAlgoQuery = new Parse.Query(UsersBarAlgo);

  var promise = Parse.Promise.as();
  _.times(iterations, function() {
    promise = promise.then(function() {
      var count = 0;

      usersBarAlgoQuery.include('barId.userId');
      usersBarAlgoQuery.descending('objectId');
      usersBarAlgoQuery.limit(1000);
      if (!firstRun) usersBarAlgoQuery.lessThan('objectId', objectId);
      return usersBarAlgoQuery.find().then(function(results) {
        _.each(results, function(obj) {
          count = count + 1;

          if (count === 1000) {
            objectId = obj.id;
          }

          var formattedObj = {
            objectId: obj.id,
            activeBar: obj.attributes.activeBar,
            barSubsequentEntry: obj.attributes.barSubsequentEntry.toISOString(),
            initialValuesUpdated: obj.attributes.initialValuesUpdated,
            lastCreditEarned: obj.attributes.lastCreditEarned ? obj.attributes.lastCreditEarned.toISOString() : null,
            lastVisit: obj.attributes.lastVisit ? obj.attributes.lastVisit.toISOString() : null,
            lockOutEndTime: obj.attributes.lockOutEndTime.toISOString(),
            numberOfVisits: obj.attributes.numberOfVisits,
            sessionEndTime: obj.attributes.sessionEndTime.toISOString(),
            sessionStartTime: obj.attributes.sessionStartTime.toISOString(),
            timeSpent: obj.attributes.timeSpent,
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
