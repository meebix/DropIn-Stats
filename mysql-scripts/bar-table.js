// Bar Table Dump

var Parse = require('parse/node');
var json2csv = require('json2csv');
var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');
var env = require('../environments');

// Parse Keys
Parse.initialize(env.PARSE_ID);
Parse.serverURL = env.SERVER_URL;

var Bar = Parse.Object.extend('Bar');

// Data Dump
var total;
var iterations;
var firstRun = true;
var objectId = null;
var tableData = [];
var filename;
var fields = [
  'objectId',
  'name',
  'address',
  'city',
  'state',
  'phone',
  'email',
  'description',
  'zip',
  'reward',
  'beaconMajor',
  'beaconMinor',
  'latitude',
  'longitude',
  'photo',
  'thumbnail',
  'mondayPromotion',
  'tuesdayPromotion',
  'wednesdayPromotion',
  'thursdayPromotion',
  'fridayPromotion',
  'saturdayPromotion',
  'sundayPromotion',
  'isActive',
  'createdAt',
  'updatedAt'
];

// Filename
if (env.ENV === 'production') {
  filename = 'bar-table.csv';
} else {
  filename = 'uat-bar-table.csv';
}

// Query
var barQuery = new Parse.Query(Bar);
barQuery.count().then(function(totalRows) {
  total = totalRows;
  iterations = Math.ceil(total / 1000);
})
.then(function() {
  var barQuery = new Parse.Query(Bar);

  var promise = Parse.Promise.as();
  _.times(iterations, function() {
    promise = promise.then(function() {
      var count = 0;

      barQuery.include('barId.userId');
      barQuery.descending('objectId');
      barQuery.limit(1000);
      if (!firstRun) barQuery.lessThan('objectId', objectId);
      return barQuery.find().then(function(results) {
        _.each(results, function(obj) {
          count = count + 1;

          if (count === 1000) {
            objectId = obj.id;
          }

          var formattedObj = {
            objectId: obj.id,
            name: obj.attributes.name ? obj.attributes.name : null,
            address: obj.attributes.address ? obj.attributes.address : null,
            city: obj.attributes.city ? obj.attributes.city : null,
            state: obj.attributes.state ? obj.attributes.state : null,
            phone: obj.attributes.phone ? obj.attributes.phone : null,
            email: obj.attributes.email ? obj.attributes.email : null,
            description: obj.attributes.description ? obj.attributes.description : null,
            zip: obj.attributes.zip ? obj.attributes.zip : null,
            reward: obj.attributes.reward ? obj.attributes.reward : null,
            beaconMajor: obj.attributes.beaconMajor ? obj.attributes.beaconMajor : null,
            beaconMinor: obj.attributes.beaconMinor ? obj.attributes.beaconMinor : null,
            latitude: obj.attributes.latitude ? obj.attributes.latitude : null,
            longitude: obj.attributes.longitude ? obj.attributes.longitude : null,
            photo: obj.attributes.photo ? obj.attributes.photo._url : null,
            thumbnail: obj.attributes.thumbnail ? obj.attributes.thumbnail._url : null,
            mondayPromotion: obj.attributes.mondayPromotion ? obj.attributes.mondayPromotion : null,
            tuesdayPromotion: obj.attributes.tuesdayPromotion ? obj.attributes.tuesdayPromotion : null,
            wednesdayPromotion: obj.attributes.wednesdayPromotion ? obj.attributes.wednesdayPromotion : null,
            thursdayPromotion: obj.attributes.thursdayPromotion ? obj.attributes.thursdayPromotion : null,
            fridayPromotion: obj.attributes.fridayPromotion ? obj.attributes.fridayPromotion : null,
            saturdayPromotion: obj.attributes.saturdayPromotion ? obj.attributes.saturdayPromotion : null,
            sundayPromotion: obj.attributes.sundayPromotion ? obj.attributes.sundayPromotion : null,
            isActive: obj.attributes.isActive ? obj.attributes.isActive : null,
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
