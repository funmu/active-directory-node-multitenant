---
services: API-with-active-directory-protected-access
platforms: nodejs
author: muralik
---

# Configuration for setting up Azure AD protection for REST APIs

A set of simple steps are required before we can use the node sample.

## Quick Start

### Step 1: Register a Azure AD Tenant

To use this sample you will need a Azure Active Directory Tenant. If you're not sure what a tenant is or how you would get one, read [What is an Azure AD tenant](http://technet.microsoft.com/library/jj573650.aspx)? or [Sign up for Azure as an organization](http://azure.microsoft.com/en-us/documentation/articles/sign-up-organization/). These docs should get you started on your way to using Azure AD.

Let us suppose your directory is named **ADSampler1**
_NOTE: Please name your Directory in a friendly and unique manner_

### Step 2: Register your Web API with your Azure AD Tenant

After you get your Azure AD tenant, add this sample app to your tenant so you can use it to protect your API endpoints. 
If you need help with this step, see: 
[Register the REST API Service Azure Active Directory](https://github.com/AzureADSamples/WebAPI-Nodejs/wiki/Setup-Windows-Azure-AD)

### Step 3: Download node.js for your platform
To successfully use this sample, you need a working installation of Node.js.

Install Node.js from [http://nodejs.org](http://nodejs.org).

### Step 4: Download the Sample application and modules

Next, clone the sample repo and install the Node Package Manager (npm).

From your shell or command line:

* `$ git clone https://github.com/AzureADSamples/active-directory-node-multitenant`
* `$ cd AuthenticatedApi1`
* `$ npm install`

### Step 5: Set up the API app

Let us call this API service **AuthenticatedApi1**. It will be created as a "Web API" app in Azure AD Applications.

* Create an Azure App and choose _Web API_ in the creation using walk through wizards in [Azure Management Portal](http://manage.windowsazure.com).
 * Set up the Sign-on URL as **http://localhost:8888/**
 * Set up the App ID URI that is global. Say **http://ADSample1.onmicrosoft.com/AuthenticatedApi1**
* To make the available for any tenant, configure the "Azure AD App" as Multi-tennat App. 
 * This is achieved through toggling the **APPLICATION IS MULTI-TENANT** switch to **YES** in the "Configure" tab of Azure App.

 After the configuration, note down the **Client ID** for this App - it will be used in the app configuration later on.

### Step 6: Set up the client to call into the new Api app.

Let us call this calling client **AuthenticatedCaller1**. This has to be created as a "native app" so we can use the App ID in any type of calling app (powershell, nodejs client, curl, native window app, etc.). You can find more information about Native Applications model at [Native Application to Web API](https://azure.microsoft.com/en-us/documentation/articles/active-directory-authentication-scenarios/#native-application-to-web-api)

* Create an Azure App and choose _Native client application_ in the Azure AD App creation workflow.
 * Set up the Redirect URI as  **urn:ietf:wg:oauth:2.0:oob**. This is a special value for OAuth2 calls from out of band.
* Use the **Add Application** to add _Delegated Permissions_ to access "AuthenticatedApi1". (follow the wizard flow; yes the workflow is not easy, but it is functional).

 After the configuration, note down the **Client ID** for this Caller - it will be used in the app configuration later on.

### Step 7: Include the Caller app as a trusted known client Application

We need to explicitly mark the caller app as one of the trusted caller for the called API Application. 
We do this by adding the **Client ID** for the Caller App inside the **knownClientApplications** value of AuthenticatedApi1 app's manifest.
 
> "knownClientApplications": [
>    'Client ID for the AuthenticatedCaller1 goes here'
> ]

You do this through three steps
 1. Download manifest from "AuthenticatedApi1" app
 2. Modify the JSON manifest file locally to include the "Client ID"
 3. Upload new manifest to the "AuthenticatedApi1" app

### Step 8: Configure your server using [API config.json](AuthenticatedApi1\config.json)

You will need to update the sample to use new **Client ID for AuthenticatedApi1** as the value for audience field.

For example the config.json file should have the entry as:

>{
>   "identityMetadata": "https://login.microsoftonline.com/common/.well-known/openid-configuration",
>   "validateIssuer": false,
>   "audience": "http://ADSample1.onmicrosoft.com/AuthenticatedApi1"
>}

 The various config items used are:
 * identityMetadata - URI for Azure AD login for multi-tenant access
 * validateIssuer - (default: false) - should we validate the issuer of the token
 * audience - URI for the resource being protected

**NOTE:** You may set up the issuer to be a valid entry if issuer validation is desired.

### Step 9: Configure your caller to use the right IDs

Your caller code also should have the right configuration set up in the [caller config.json](../AuthenticatedCaller/config.json) as follows:

 * **Client ID for AuthenticatedCaller1** is stored as **clientID**
 * **App ID URI for AuthenticatedApi1** is stored as **resourceAppIdUri**

For example the AuthenticatedCaller\config.json file should have the entry as:

>   "clientID":"Client ID for the AuthenticatedCaller1 goes here"
>   "resourceAppIdURI" : "http://ADSample1.onmicrosoft.com/AuthenticatedApi1"

**NOTE:** Make sure to pay attention to the specific JSON file syntax used here.
