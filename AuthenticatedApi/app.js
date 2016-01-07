/*
 app.js

    Sample Application illustrating the use of Authentication with Azure AD
    Simplified enough to illustrate the authentication parts with 
        in-memory ToDo list.
    Thanks to original source from 
        https://github.com/Azure-Samples/active-directory-node-webapi

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

'use strict';

/**
 * Module dependencies.
 */

// --------------------------------------------
//  Load up config
//    look for an override config in environment
//    if no overrides, then use the default 'config.json'
var fs = require('fs');

var configForApi = process.env.configForApi;

if (configForApi == null) {
    configForApi = "config.json";
}

var g_config = null;
try {
    var cfg = fs.readFileSync( configForApi, "utf8");
    g_config = JSON.parse(cfg);
} catch (e) {
    console.log( "  ERROR: unable to load config from '%s'.", configForApi);
    console.log(e);
}

// --------------------------------------------
//  Set up all the Logger Module

var bunyan = require('bunyan');
// Our logger
var log = bunyan.createLogger({
    name: 'AuthenticatedAPI'
});

// --------------------------------------------
//  Authentication Modules 
var AuthManager = require('./AuthManager');
var g_authManager = new AuthManager( log);

// --------------------------------------------
//  Application Objects
var TaskManager= require('./TaskManager');
var g_taskManager = new TaskManager( log, g_authManager);

// We pass these options in to the ODICBearerStrategy.
var authenticationOptions = {
    // The URL of the metadata document for your app. We will put the keys for token validation from the URL found in the jwks_uri tag of the in the metadata.
    identityMetadata: g_config.identityMetadata,
    issuer: g_config.issuer,
    validateIssuer: g_config.validateIssuer,
    audience: g_config.audience
};

// --------------------------------------------
//  REST Specifc modules
var restify = require('restify');
// Setup some configuration
var serverPort = process.env.PORT || 8888;

/**
 *
 * APIs for our REST Task server
 */

var server = restify.createServer({
    name: "Authenticated API Server",
    version: "1.0.0"
});

// Ensure we don't drop data on uploads
server.pre(restify.pre.pause());

// Clean up sloppy paths like //todo//////1//
server.pre(restify.pre.sanitizePath());

// Handles annoying user agents (curl)
server.pre(restify.pre.userAgentConnection());

// Set a per request bunyan logger (with requestid filled in)
server.use(restify.requestLogger());

// Allow 5 requests/second by IP, and burst to 10
server.use(restify.throttle({
    burst: 10,
    rate: 5,
    ip: true,
}));

// Use the common stuff you probably want
server.use(restify.acceptParser(server.acceptable));
server.use(restify.dateParser());
server.use(restify.queryParser());
server.use(restify.gzipResponse());
server.use(restify.bodyParser({
    mapParams: true
})); // Allows for JSON mapping to REST
server.use(restify.authorizationParser()); // Looks for authorization headers

// Let's start using Authentication Manager
server.use( g_authManager.initialize()); // Starts Authentication Manager
server.use( g_authManager.session()); // Provides session support

g_authManager.setupBearerStrategy( authenticationOptions);

/// Now the real handlers. Here we just CRUD

/**
/*
/* Each of these handlers are protected by our OIDCBearerStrategy by invoking 'oauth-bearer'
/* in the pasport.authenticate() method. We set 'session: false' as REST is stateless and
/* we don't need to maintain session state. You can experiement removing API protection
/* by removing the passport.authenticate() method like so:
/*
**/

server.get('/tasks', 
    g_authManager.authenticate('oauth-bearer', { session: false}),
    g_taskManager.listTasks.bind(g_taskManager));
server.head('/tasks', 
    g_authManager.authenticate('oauth-bearer', { session: false}),
    g_taskManager.listTasks.bind(g_taskManager));

server.get('/tasks/:owner',
    g_authManager.authenticate('oauth-bearer', { session: false}),
    g_taskManager.getTask.bind(g_taskManager));
server.head('/tasks/:owner',
    g_authManager.authenticate('oauth-bearer', { session: false}),
    g_taskManager.getTask.bind(g_taskManager));

server.post('/tasks/:owner/:task',
    g_authManager.authenticate('oauth-bearer', { session: false}),
    g_taskManager.createTask.bind(g_taskManager));
server.post('/tasks',
    g_authManager.authenticate('oauth-bearer', { session: false}),
    g_taskManager.createTask.bind(g_taskManager));

server.del('/tasks/:owner/:task',
    g_authManager.authenticate('oauth-bearer', { session: false}),
    g_taskManager.removeTask.bind(g_taskManager));
server.del('/tasks/:owner',
    g_authManager.authenticate('oauth-bearer', { session: false}),
    g_taskManager.removeTask.bind(g_taskManager));
server.del('/tasks',
    g_authManager.authenticate('oauth-bearer', { session: false}),
    g_taskManager.removeTask.bind(g_taskManager));

/*
server.del('/tasks',
    g_authManager.authenticate('oauth-bearer', { session: false}),
    g_taskManager.removeAll.bind(g_taskManager),
    function respond(req, res, next) {
        res.send(204);
        next();
    });
*/

// Register a default '/' handler

server.get('/', function root(req, res, next) {
    var routes = [
        'GET     /',
        'POST    /tasks/:owner/:task',
        'POST    /tasks (for JSON body)',
        'GET     /tasks',
        'PUT     /tasks/:owner',
        'GET     /tasks/:owner'
        // ,'DELETE  /tasks/:owner/:task'
    ];
    res.send(200, routes);
    next();
});


server.listen(serverPort, function() {

    var apiServerLocation="http://localhost:" + serverPort;
    var consoleMessage = '\n REST API protected with Azure Active Directory';
    consoleMessage += '\n +++++++++++++++++++++++++++++++++++++++++++++++++++++';
    consoleMessage += '\n API Server [%s] is listening at %s';
    consoleMessage += '\n Open your browser to %s/tasks\n';
    consoleMessage += '+++++++++++++++++++++++++++++++++++++++++++++++++++++ \n';
    consoleMessage += '\n !!! why not try a $curl -isS %s | json to get some ideas? \n';
    consoleMessage += '+++++++++++++++++++++++++++++++++++++++++++++++++++++ \n\n';

    log.info(consoleMessage, server.name, apiServerLocation, apiServerLocation, apiServerLocation);

});
