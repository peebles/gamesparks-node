# gamesparks-node #

This repository is a fork of https://bitbucket.org/gamesparks/gamesparks-node-server-sdk.

## Introduction ##

This library provides communication capability between node.js and the GameSparks platform.

This allows node.js to send requests and receive the responses from the platform on behalf of players.

Sockets can also be configured to optionally listen for push messages to a particular player.

Include the library as you would any other module

    npm install gamesparks-node
    
    var gameSparks = require( 'gamesparks-node' );
	
The library can be configured to connect to either the development, or live servers and also be configured as a sender (request/response) or a listener (push messages)	

Listener configurations are capable of sending requests, senders can never receive messages.

## Initialisation Options ##

You need to select an initialisation option. The library can only be initialised once, subsequent calls to initialisation are ignored.

### Initialise as a sender to the development servers. No push messages will be received. ###

    gameSparks.initPreviewSender(gameApiKey, secret, socketCount, onInit, onError)

### Initialises as a listener to the development servers. Push messages will be received.	###

    gameSparks.initPreviewListener(gameApiKey, secret, socketCount, onMessage, onInit, onError)
	
### Initialises as a sender to the live servers. No push messages will be received. ###

    gameSparks.initLiveSender(gameApiKey, secret, socketCount, onInit, onError);

### Initialises as a listener to the live servers. Push messages will be received. ###
	
    gameSparks.initLiveListener(gameApiKey, secret, socketCount, onMessage, onInit, onError);
    
### Initialse as a sender with a url

    gameSparks.init("wss://service.gamesparks.net/ws/server/{gameApiKey}", secret, 10, onMessage, onInit, onError);    

### Initialse as a listener with a url

    gameSparks.init("wss://service.gamesparks.net/ws/server-send/{gameApiKey}", secret, 10, onMessage, onInit, onError);    

### Parameters ###

* gameApiKey - The is the apiKey of you game within the gamesparks platform. This value is available through the portal.
* secret - This is the server secret for you game. You will need to request this value for each game you want to use. IT IS NOT THE API SECRET in the portal. A different secret is configured for server to server communications as the access permissions are elevated.
* socketCount - The maximum number of open sockets to maintain between platforms. Suggest a relativly low number (20) to start with in development. The maximum number for development servers is 50.
* onMessage(listeners only) - Provide the function you want to be called when a message is received. This method will be passed the json object received from the server as the first parameter.
* onInit - A callback function that is invoken when the SDK connects sucessfully to gamesparks
* onError - A callback function invoked when there is an error.  It is passed a single node Error object.

## Sending Requests ##

To send a request, you need to construct the JSON data you want to send, and call the following method

    gameSparks.sendAs( playerId, requestType, data, callback )

The previously published versions of this library used a non-standard way of calling asynchronious
functions.  You can continue to use this non-standard pattern in existing code like this:

    gameSparks.sendAsDepricated( playerId, requestType, data, onResponse, onError )

### Parameters ###

* playerId - The ID of the player you are sending the request for (or null when authenticating)
* requestType - The type of request. For posting scores this will be ".LogEventRequest" but other calls are available.
* data - The additional data to pass as part of the request. See the example further down.
* callback( err, response ) - If there was an error, err will be a node Error object.  Otherwise response is the data back from gamesparks.

The depricated options are:

* onResponse - Your function to process the response from gamesparks.
* onError - A callback function invoked when there is an error.  It is passed a single node Error object.

## Authentication ##

To get a `playerId` to make `sendAs` calls, you must authenticate a user or a device.  You can use `sendAs` like the
following to get a `playerId`:

    gameSparks.sendAs( null, ".AuthenticationRequest", { userName: "testUser", password: "123" }, function( err, response ) {
      if ( err ) console.log( err.messaage );
      else playerId = response.userId;
    });

The `playerId` obtained can now be used as the first argument to subsequent `sendAs` calls.

## Sending a score ##
 
Assumes you have an event configured with event code HIGH_SCORE, and a single attribute named "SCORE".

    gameSparks.sendAs(
      playerId,
      ".LogEventRequest", 
      { "eventKey" : "HIGH_SCORE", "SCORE" : 1000 }, 
      function( err, response ) {
        if ( err ) console.log( err.message );
	else console.log( JSON.stringify( response ) );
      });

## Getting the global top 5 of a leaderbord ##

Assumes you have a leaderboard with short code "LB1".

    gameSparks.sendAs(
      playerId,
      ".LeaderboardDataRequest", 
      { "leaderboardShortCode": "LB1","social": "false","entryCount": "5","offset": "0" }, 
      function( err, response ) {
        if ( err ) console.log( err.message );
	else console.log( JSON.stringify( response ) );
      });

## Example

There is an example script located in ./example.  Please read the README.md
file located there for details.

## Client/Server

There is a more extensive set of scripts in ./client-server which you can use
as a command line interface alternative to the Gamesparks test harness.
Please read the README.md file located there for details.
