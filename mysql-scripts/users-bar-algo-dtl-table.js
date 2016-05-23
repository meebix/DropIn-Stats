// Users Bar Algo Detail Table Dump

var Parse = require('parse').Parse;
var json2csv = require('json2csv');
var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');
var env = require('../environments');

// Parse Keys
Parse.initialize(env.PARSE_ID, env.PARSE_SECRET);

var UsersBarAlgoDtl = Parse.Object.extend('Users_Bar_Algo_Dtl');

// Data Dump
var total;
var iterations;
var firstRun = true;
var objectId = null;
var tableData = [];
var filename;
var fields = [
  'objectId',
  'algoBarObjId',
  'atBar',
  'barAlgo',
  'userId',
  'createdAt',
  'updatedAt'
];

// Filename
if (env.ENV === 'production') {
  filename = 'users-bar-algo-dtl-table.csv';
} else {
  filename = 'uat-users-bar-algo-dtl-table.csv';
}

// Query
var usersBarAlgoDtlQuery = new Parse.Query(UsersBarAlgoDtl);
usersBarAlgoDtlQuery.count().then(function(totalRows) {
  total = totalRows;
  iterations = Math.ceil(total / 1000);
})
.then(function() {
  var usersBarAlgoDtlQuery = new Parse.Query(UsersBarAlgoDtl);

  var promise = Parse.Promise.as();
  _.times(iterations, function() {
    promise = promise.then(function() {
      var count = 0;

      usersBarAlgoDtlQuery.include('userId');
      usersBarAlgoDtlQuery.descending('objectId');
      usersBarAlgoDtlQuery.limit(1000);
      if (!firstRun) usersBarAlgoDtlQuery.lessThan('objectId', objectId);
      return usersBarAlgoDtlQuery.find().then(function(results) {
        _.each(results, function(obj) {
          count = count + 1;

          if (count === 1000) {
            objectId = obj.id;
          }

          var formattedObj = {
            objectId: obj.id,
            algoBarObjId: obj.attributes.algoBarObjId ? obj.attributes.algoBarObjId : null,
            atBar: obj.attributes.atBar,
            barAlgo: obj.attributes.barAlgo ? obj.attributes.barAlgo : null,
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
