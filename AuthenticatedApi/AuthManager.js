/*
	AuthManager.js
		Simple Authentication Manager helperthat uses Open ID connect header model.

    This is intended as a sample only.

 Copyright (c) Microsoft Corporation
 All Rights Reserved
 Apache License 2.0

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/*
	AuthManager.js - simple OAuth2.0 bearer token based Authentication Manager
*/
(function() {

	// --------------------------------------------
	//  Authentication Modules 
	var passport = require('passport');
	var OIDCBearerStrategy = require('passport-azure-ad').BearerStrategy;

	var AuthManager = function( logger) {
		this.log = logger;
		// array to hold logged in users and the current logged in user (owner)
		this.users = [];
		this.owner = null;
	}

	AuthManager.prototype.getOwner = function()
	{
		return this.owner;
	}

	AuthManager.prototype.initialize = function()
	{
		this.log.info( "AuthManager::Initializing() called");
		return passport.initialize();
	}

	AuthManager.prototype.session = function()
	{
		this.log.info( "AuthManager::session() called");
		return passport.session();
	}



	/**
	/*
	/* Calling the OIDCBearerStrategy and managing users
	/*
	/* Passport pattern provides the need to manage users and info tokens
	/* with a FindorCreate() method that must be provided by the implementor.
	/* Here we just autoregister any user and implement a FindById().
	/* You'll want to do something smarter.
	**/

	AuthManager.prototype.findById = function(id, fn) {

	    for (var i = 0, len = this.users.length; i < len; i++) {
	        var user = this.users[i];
	        if (user.sub === id) {
	            this.log.info('Found user: ', user);
	            return fn(null, user);
	        }
	    }
	    return fn(null, null);
	};

    AuthManager.prototype.processFoundToken = function(done, token, err, user) 
    {
        if (err) {
            return done(err);
        }

        if (!user) {
            // "Auto-registration"
            this.log.info('User was added automatically as they were new. Their sub is: ', token.sub);
            this.users.push(token);
            this.owner = token.sub;
            return done(null, token);
        }

        this.owner = token.sub;
        return done(null, user, token);
    }

	AuthManager.prototype.verifyToken = function( token, done)
	{
        this.log.info(' Verifying the user');
        this.log.info( token, 'was the token retreived');

        this.findById(token.sub, this.processFoundToken.bind(this, done, token));
	}

	AuthManager.prototype.setupBearerStrategy = function( authOptions)
	{
		var oidcStrategy = new OIDCBearerStrategy( authOptions, this.verifyToken.bind(this));
		passport.use(oidcStrategy);

		this.log.info(" Setup Bearer Strategy for authentication");
	}

	AuthManager.prototype.authenticate = function( oauthType, options)
	{
		this.log.info(" Authentication called with OAuth Type(%s)", oauthType);
		return passport.authenticate( oauthType, options);
	}

	module.exports = AuthManager;
})();
