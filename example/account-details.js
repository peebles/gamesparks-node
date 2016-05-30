// YOU MUST CREATE A CONFIG FILE TO RUN THIS EXAMPLE!  SEE README.md IN THIS DIRECTORY!
var config     = require( "./config.json" );

var gameSparks = require( "../GameSparks" );

// This example uses npm "async" library.  Remind the user to install it first.
try {
  var async      = require( "async" );
} catch( err ) {
  console.log( "FATAL: Please run \"npm install async\" before trying to run this script." );
  process.exit(1);
}

// When a message arrives from the Gamesparks server for us ...
function onMessage( msg ) {
  console.log( "-------------------------------------------------------------" );
  console.log( "received a message:", JSON.stringify( msg, null, 2 ) );
}

// Initialize a "listener", which can send messages, but which can also receive
// messages asynchroniously.
gameSparks.initPreviewListener( config.gameApiKey, config.secret, 10, onMessage, app, function( err ) {
  console.log( "initializing preview listener:", err );
  process.exit( 1 );
});

// This gets called with the SDK has been initialized and is ready to communicate with
// Gamesparks ...
function app() {
  console.log( "Gamesparks ready!" );

  async.waterfall([
    function( cb ) {
      // Authenticate
      gameSparks.sendAs( null, ".AuthenticationRequest", {
	userName: config.testUser.username,
	password: config.testUser.password
      }, function( err, user ) {
	if ( err ) return cb( err );
	else return cb( null, user );
      });
    },
    function( user, cb ) {
      // Get the user's account details
      gameSparks.sendAs( user.userId, ".AccountDetailsRequest", {}, function( err, res ) {
	if ( err ) return cb( err );
	console.log( "account details:", JSON.stringify( res, null, 2 ) );
	cb( null, user );
      });
    },
  ], function( err ) {
    if ( err ) console.log( err );

    // If you want to listen for messages back from the Gamesparks server, then do
    // not exit() here.  Just sit around and wait ...
    
    process.exit(0);
  });
  
}

