// Users Promotions Table Dump

var Parse = require('parse').Parse;
var json2csv = require('json2csv');
var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');
var env = require('../environments');

// Parse Keys
Parse.initialize(env.PARSE_ID, env.PARSE_SECRET);

var UsersPromotions = Parse.Object.extend('Users_Promotions');

// Data Dump
var total;
var iterations;
var firstRun = true;
var objectId = null;
var tableData = [];
var filename;
var fields = [
  'objectId',
  'lastPromotionUsed',
  'pendingReferralCredits',
  'sentShares',
  'shareCode',
  'shareCreditReceived',
  'totalReferralCredits',
  'userId',
  'createdAt',
  'updatedAt'
];

// Filename
if (env.ENV === 'production') {
  filename = 'users-promotions-table.csv';
} else {
  filename = 'uat-users-promotions-table.csv';
}

// Query
var usersPromotionsQuery = new Parse.Query(UsersPromotions);
usersPromotionsQuery.count().then(function(totalRows) {
  total = totalRows;
  iterations = Math.ceil(total / 1000);
})
.then(function() {
  var usersPromotionsQuery = new Parse.Query(UsersPromotions);

  var promise = Parse.Promise.as();
  _.times(iterations, function() {
    promise = promise.then(function() {
      var count = 0;

      usersPromotionsQuery.include('userId');
      usersPromotionsQuery.descending('objectId');
      usersPromotionsQuery.limit(1000);
      if (!firstRun) usersPromotionsQuery.lessThan('objectId', objectId);
      return usersPromotionsQuery.find().then(function(results) {
        _.each(results, function(obj) {
          count = count + 1;

          if (count === 1000) {
            objectId = obj.id;
          }

          var formattedObj = {
            objectId: obj.id,
            lastPromotionUsed: obj.attributes.lastPromotionUsed ? obj.attributes.lastPromotionUsed : null,
            pendingReferralCredits: obj.attributes.pendingReferralCredits ? obj.attributes.pendingReferralCredits : null,
            sentShares: obj.attributes.sentShares ? obj.attributes.sentShares : null,
            shareCode: obj.attributes.shareCode ? obj.attributes.shareCode : null,
            shareCreditReceived: obj.attributes.shareCreditReceived,
            totalReferralCredits: obj.attributes.totalReferralCredits ? obj.attributes.totalReferralCredits : null,
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
