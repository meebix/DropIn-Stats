// Users Rewards Table Dump

var Parse = require('parse/node');
var json2csv = require('json2csv');
var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');
var env = require('../environments');

// Parse Keys
Parse.initialize(env.PARSE_ID);
Parse.serverURL = env.SERVER_URL;

var UsersRewards = Parse.Object.extend('Users_Rewards');

// Data Dump
var total;
var iterations;
var firstRun = true;
var objectId = null;
var tableData = [];
var filename;
var fields = [
  'objectId',
  'userId',
  'barId',
  'userHasRedeemed',
  'redeemedOnDate',
  'acquiredDate',
  'rewardType',
  'rewardName',
  'rewardActiveEnd',
  'rewardActiveStart',
  'barIdFromAlgo',
  'createdAt',
  'updatedAt',
  'selectedRewardName'
];

// Filename
if (env.ENV === 'production') {
  filename = 'users-rewards-table.csv';
} else {
  filename = 'uat-users-rewards-table.csv';
}

// Query
var usersRewardsQuery = new Parse.Query(UsersRewards);
usersRewardsQuery.count().then(function(totalRows) {
  total = totalRows;
  iterations = Math.ceil(total / 1000);
})
.then(function() {
  var usersRewardsQuery = new Parse.Query(UsersRewards);

  var promise = Parse.Promise.as();
  _.times(iterations, function() {
    promise = promise.then(function() {
      var count = 0;

      usersRewardsQuery.include('barId.userId');
      usersRewardsQuery.descending('objectId');
      usersRewardsQuery.limit(1000);
      if (!firstRun) usersRewardsQuery.lessThan('objectId', objectId);
      return usersRewardsQuery.find().then(function(results) {
        _.each(results, function(obj) {
          count = count + 1;

          if (count === 1000) {
            objectId = obj.id;
          }

          var formattedObj = {
            objectId: obj.id,
            userId: obj.attributes.userId ? obj.attributes.userId.id : null,
            barId: obj.attributes.barId ? obj.attributes.barId.id : null,
            userHasRedeemed: obj.attributes.userHasRedeemed,
            redeemedOnDate: obj.attributes.redeemedOnDate ? obj.attributes.redeemedOnDate.toISOString() : null,
            acquiredDate: obj.attributes.acquiredDate ? obj.attributes.acquiredDate.toISOString() : null,
            rewardType: obj.attributes.rewardType ? obj.attributes.rewardType : null,
            rewardName: obj.attributes.rewardName ? obj.attributes.rewardName : null,
            rewardActiveEnd: obj.attributes.rewardActiveEnd ? obj.attributes.rewardActiveEnd.toISOString() : null,
            rewardActiveStart: obj.attributes.rewardActiveStart ? obj.attributes.rewardActiveStart.toISOString() : null,
            barIdFromAlgo: obj.attributes.barIdFromAlgo ? obj.attributes.barIdFromAlgo.id : null,
            createdAt: obj.createdAt.toISOString(),
            updatedAt: obj.updatedAt.toISOString(),
            selectedRewardName: obj.attributes.selectedRewardName ? obj.attributes.selectedRewardName : null
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
