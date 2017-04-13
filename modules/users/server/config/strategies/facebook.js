'use strict';

/**
 * Module dependencies
 */
var passport = require('passport'),
  FacebookStrategy = require('passport-facebook').Strategy,
  users = require('../../controllers/users.server.controller.js');

var request = require('request');
var async = require('async');
var util = require('util');
module.exports = function (config) {
  // Use facebook strategy
  passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.facebook.callbackURL,
    profileFields: ['id', 'name', 'displayName', 'emails', 'photos'],
    passReqToCallback: true
  },
  function (req, accessToken, refreshToken, profile, done) {
    // Set the provider data and include tokens
    var providerData = profile._json;
    providerData.accessToken = accessToken;
    providerData.refreshToken = refreshToken;

    var uri = 'https://graph.facebook.com/v2.8/me/albums?fields=type&limit=500&access_token=' + providerData.accessToken ;
    var albumId = '';

    async.waterfall([
      function (done1) {
        request({
          url: uri,
          method: 'GET'
        }, function (error, response, body) {
          body = JSON.parse(body);
          for(var i = 0; i < body.data.length; i++){
            if (body.data && body.data[i].type == "profile"){
              var photoUri = 'https://graph.facebook.com/v2.8/' + body.data[i].id + '?fields=photos.limit(100){images}&access_token=' + providerData.accessToken;
              request({
                uri: photoUri,
                method: 'GET'
              }, function (error, response, body) {
                body = JSON.parse(body);
                var profileImageURL = [];
                for(var i =0; i < body.photos.data.length; i++){
                  profileImageURL.push(body.photos.data[i].images[0].source);
                }
                return done1(error, profileImageURL)
              })
            }
          }
          if (!error && response.statusCode == 200) {

          }
        });
      },
      function (profileImageURL) {
        // Create the user OAuth profile
        var providerUserProfile = {
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          displayName: profile.displayName,
          email: profile.emails ? profile.emails[0].value : undefined,
          username: profile.username || generateUsername(profile),
          profileImageURL: profileImageURL,
          // profileImageURL: (profile.id) ? '//graph.facebook.com/' + profile.id + '/picture?type=large' : undefined,
          provider: 'facebook',
          providerIdentifierField: 'id',
          providerData: providerData
        };

        // Save the user OAuth profile
        users.saveOAuthUserProfile(req, providerUserProfile, done);
      }
    ]);

    function generateUsername(profile) {
      var username = '';

      if (profile.emails) {
        username = profile.emails[0].value.split('@')[0];
      } else if (profile.name) {
        username = profile.name.givenName[0] + profile.name.familyName;
      }

      return username.toLowerCase() || undefined;
    }
  }));
};
