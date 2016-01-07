---
services: API-with-active-directory-protected-access
platforms: nodejs
author: muralik
---

# Simple Sample for use of Azure AD to protect web APIs

This Node.js server will give you a quick and easy sample for setting up REST API service using OAuth2 protocol. Then this service is integrated with Azure Active Directory for API protection. The sample server included in the download are designed to run on any platform. The APIs themselves are kept very simple so we can illustrate the work requried to set up OAuth2 based Azure AD authenticated calls from clients like Powershell.


## Solution Overview

There are three major components to the solution including a way to test how the APIs work

### 1. Configuration
A variety of simple configuration steps are required on the [Azure Management Portal](http://manage.windowsazure.com). 
These steps are detaliled in the [Configuration Setup](config/).

### 2. AuthenticatedApi
This is the primary node module that exposes the REST APIs. This REST API server is built using Restify with the following features:

* A node.js server running an REST API interface with JSON
* REST APIs leveraging OAuth2 API protection for endpoints using Azure Active Directory
* No persistent store is used. (there are many samples that illustrate how to use storage in nodejs, so I skipped it)

This REST API has two simple methods to start with:
* **/tasks** that just lists a set of tasks when invoked using HTTP GET
* **/tasks** that creates a new task when invoked with HTTP POST

### 3. AuthenticatedCaller
This is the module or calling client that shows how to use the Authenticated API. We will use a **Windows Powershell** example for now. 
One can modify this for **Python** or **NodeJS clients** or other desktop / mobile clients.

## Running the Services and Checking Results

### 1. Run the API service

* `cd AuthenticatedApi`
* `node app.js`

**Is the server output hard to understand?:** We use `bunyan` for logging in this sample. The console won't make much sense to you unless you also install bunyan and run the server like above but pipe it through the bunyan binary:

* `npm install -g bunyan`
* `node app.js | bunyan`

You will have a server successfully running on `http://localhost:8888`. 
Your REST / JSON API Endpoint will be 

* **/tasks** that just lists a set of tasks when invoked using HTTP GET
* **/tasks** that creates a new task when invoked with HTTP POST

### 2. Run the Powershell client

* `cd AuthenticatedCaller`
* `powershell -F ApiCaller.ps1`

If all is well, you will be prompted to login through a special window. Once logged in, the credential of the logged in user is used to make API calls.

### You're done!

## Acknowledgements

I read through several Azure AD samples to create a simplified version. Some of these samples used mongodb for data store which has its own configuration details. To keep things simple, I trimmed the sample to be trivial one. I thank many folks in Azure Active Directory who helped me with the analysis and simplification of the samples. Working with such great partners in the open source community clearly illustrates what open collaboration can accomplish. Thank you!

- [Azure AD protected Web API sample](https://github.com/Azure-Samples/active-directory-node-webapi) - sample app with REST + mongoDB + Azure AD authentication
- [Restify](http://mcavage.me/node-restify/) - Restify is a node.js module built specifically to enable you to build correct REST web services. ``` node-restify```
- [Restify-OAuth2](https://github.com/domenic/restify-oauth2) - This package provides a very simple OAuth 2.0 endpoint for the Restify framework. ``` restify-oauth2```
- [node-jwt-simple](https://github.com/hokaccha/node-jwt-simple) - Library for parsing JSON Web Tokens (JWT) ```node-jwt-simple```
- [http-bearer-strategy](https://github.com/jaredhanson/passport-http-bearer) - HTTP Bearer authentication strategy for Passport and Node.js.
- [JSON Web Token](http://jwt.io/) to look at the access token

