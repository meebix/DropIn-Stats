// App Params Table Dump

var Parse = require('parse').Parse;
var json2csv = require('json2csv');
var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');
var env = require('../environments');

// Parse Keys
Parse.initialize(env.PARSE_ID, env.PARSE_SECRET);

var AppParams = Parse.Object.extend('App_Params');

// Data Dump
var total;
var iterations;
var firstRun = true;
var objectId = null;
var tableData = [];
var filename;
var fields = [
  'objectId',
  'bool1',
  'bool2',
  'number1',
  'number2',
  'number3',
  'number4',
  'number5',
  'paramName',
  'string1',
  'string2',
  'createdAt',
  'updatedAt'
];

// Filename
if (env.ENV === 'production') {
  filename = 'app-params-table.csv';
} else {
  filename = 'uat-app-params-table.csv';
}

// Query
var appParamsQuery = new Parse.Query(AppParams);
appParamsQuery.count().then(function(totalRows) {
  total = totalRows;
  iterations = Math.ceil(total / 1000);
})
.then(function() {
  var appParamsQuery = new Parse.Query(AppParams);

  var promise = Parse.Promise.as();
  _.times(iterations, function() {
    promise = promise.then(function() {
      var count = 0;

      appParamsQuery.descending('objectId');
      appParamsQuery.limit(1000);
      if (!firstRun) appParamsQuery.lessThan('objectId', objectId);
      return appParamsQuery.find().then(function(results) {
        _.each(results, function(obj) {
          count = count + 1;

          if (count === 1000) {
            objectId = obj.id;
          }

          var formattedObj = {
            objectId: obj.id,
            bool1: obj.attributes.bool1,
            bool2: obj.attributes.bool2,
            number1: obj.attributes.number1 ? obj.attributes.number1 : null,
            number2: obj.attributes.number2 ? obj.attributes.number2 : null,
            number3: obj.attributes.number3 ? obj.attributes.number3 : null,
            number4: obj.attributes.number4 ? obj.attributes.number4 : null,
            number5: obj.attributes.number5 ? obj.attributes.number5 : null,
            paramName: obj.attributes.paramName ? obj.attributes.paramName : null,
            string1: obj.attributes.string1 ? obj.attributes.string1 : null,
            string2: obj.attributes.string2 ? obj.attributes.string2 : null,
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
