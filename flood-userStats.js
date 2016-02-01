'use strict';

var Parse = require('parse').Parse;
var _ = require('underscore');

var Bar = Parse.Object.extend('Bar');
var User = Parse.Object.extend('User');
var Algo = Parse.Object.extend('Users_Bar_Algo');
var barQuery = new Parse.Query(Bar);

var data = {};

barQuery.equalTo('objectId', 'AbWWcIKzVC');
barQuery.first().then(function(barObj) {
  data.barId = barObj;
})
.then(function() {
  var userQuery = new Parse.Query(User);

  userQuery.equalTo('objectId', 'lM4LZoXPJU');
  return userQuery.first().then(function(userObj) {
    data.userId = userObj;
  })
  .then(function() {
    var dataObj = {
      barId: data.barId,
      userId: data.userId,
      lastCreditEarned: new Date()
    };

    _.times(12000, function() {
      var newObj = new Algo();

      return newObj.save(dataObj).then(function(savedObj) {
        console.log('New algo record saved ' + savedObj.id);
      });
    });
  });
});
