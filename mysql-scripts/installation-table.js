// Installation Table Dump

var Parse = require('parse/node');
var json2csv = require('json2csv');
var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');
var env = require('../environments');

// Parse Keys
Parse.initialize(env.PARSE_ID);
Parse.serverURL = env.SERVER_URL;

var Installation = Parse.Object.extend('Installation');

// Data Dump
var total;
var iterations;
var firstRun = true;
var objectId = null;
var tableData = [];
var filename;
var fields = [
  'objectId',
  'GCMSenderId',
  'appIdentifier',
  'appLastOpen',
  'appName',
  'appVersion',
  'badge',
  'channels',
  'deviceToken',
  'deviceType',
  'installationId',
  'isDeletingEventually',
  'localeIdentifier',
  'parseVersion',
  'pushType',
  'timeZone',
  'userId',
  'createdAt',
  'updatedAt'
];

// Filename
if (env.ENV === 'production') {
  filename = 'installation-table.csv';
} else {
  filename = 'uat-installation-table.csv';
}

// Query
var installationQuery = new Parse.Query(Installation);
installationQuery.count().then(function(totalRows) {
  total = totalRows;
  iterations = Math.ceil(total / 1000);
})
.then(function() {
  var installationQuery = new Parse.Query(Installation);

  var promise = Parse.Promise.as();
  _.times(iterations, function() {
    promise = promise.then(function() {
      var count = 0;

      installationQuery.descending('objectId');
      installationQuery.limit(1000);
      if (!firstRun) installationQuery.lessThan('objectId', objectId);
      return installationQuery.find().then(function(results) {
        _.each(results, function(obj) {
          count = count + 1;

          if (count === 1000) {
            objectId = obj.id;
          }

          var formattedObj = {
            objectId: obj.id,
            GCMSenderId: obj.attributes.GCMSenderId ? obj.attributes.GCMSenderId : null,
            appIdentifier: obj.attributes.appIdentifier ? obj.attributes.appIdentifier : null,
            appLastOpen: obj.attributes.appLastOpen ? obj.attributes.appLastOpen.toISOString() : null,
            appName: obj.attributes.appName ? obj.attributes.appName : null,
            appVersion: obj.attributes.appVersion ? obj.attributes.appVersion : null,
            badge: obj.attributes.badge ? obj.attributes.badge : null,
            channels: obj.attributes.channels ? obj.attributes.channels : null,
            deviceToken: obj.attributes.deviceToken ? obj.attributes.deviceToken : null,
            deviceType: obj.attributes.deviceType ? obj.attributes.deviceType : null,
            installationId: obj.attributes.installationId ? obj.attributes.installationId : null,
            isDeletingEventually: obj.attributes.isDeletingEventually ? obj.attributes.isDeletingEventually : null,
            localeIdentifier: obj.attributes.localeIdentifier ? obj.attributes.localeIdentifier : null,
            parseVersion: obj.attributes.parseVersion ? obj.attributes.parseVersion : null,
            pushType: obj.attributes.pushType ? obj.attributes.pushType : null,
            timeZone: obj.attributes.timeZone ? obj.attributes.timeZone : null,
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
