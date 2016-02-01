'use strict';

var Parse = require('parse').Parse;
var _ = require('underscore');

var Bar = Parse.Object.extend('Bar');
var User = Parse.Object.extend('User');
var Timeline = Parse.Object.extend('Users_Timeline');

var data = {};

var barQuery = new Parse.Query(Bar);
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
      date: new Date(),
      event: 'Credit Earned',
      eventType: 'Credit Earned'
    };

    _.times(12000, function() {
      var newObj = new Timeline();

      return newObj.save(dataObj).then(function(savedObj) {
        console.log('New timeline record saved ' + savedObj.id);
      });
    });
  });
});
