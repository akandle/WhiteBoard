'use strict';

angular.module('apiServices', [])

.factory('Lobby', function ($http) {

  var newRoom = function () {

    return $http({
      method: 'GET',
      url: '/new'
    })
    .then(function (res) {
      console.log(res)
      return res.data;
    })
    .catch(function (err) {
      console.error(err);
    })
    ;

  };

  return {
    newRoom: newRoom
    // getRoom: getRoom
  };

})

.service('soundCloud', function($http) {
  this.getSongs = function(query) {
    var url = 'https://api.soundcloud.com/tracks?q='+query+'&client_id=9e3abdceafbd5ef113b3430508a34c92&limit=10'
    console.log(query,' - ',url);
    return $http({
      method: 'GET',
      url: url
    })
    .then(function (resp) {
      return resp.data;
    });
  };
})
;