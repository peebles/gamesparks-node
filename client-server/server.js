var gameSparks = require( '../GameSparks' );
var http = require( 'http' );
var config = require( './config' );

try {
  var async = require( 'async' );
} catch( err ) {
  console.log( 'Please run "npm install async" before running this script.' );
  process.exit(1);
}

var port = process.argv[2];
if ( port == undefined ) port = 8080;
else port = Number( port );

/* 
   The http server.  This little server listens on a port for incoming POSTs 
   containing JSON in the body.  It does not error checking, but assumes the
   incoming is good.

   The request is sent via callback to the caller.  The caller will do something
   call the supplied caller callback with ( err, json ).  This is sent back to the
   connecting cient via response, always as 400/text or as 200/json.

   The request that is given to the caller:

   { method: request-method,
     url:    request-url,
     body:   request-body-already-parsed-into-javascript-object
   }
 */
function server( port, cb ) {
  function handleRequest( request, response ) {
    var method = request.method;
    var url = request.url;
    var body = [];

    //console.log( request.headers );

    request.on('data', function(chunk) {
      body.push(chunk);
    }).on('end', function() {
      body = Buffer.concat(body).toString();
      //console.log( body );
      request.body = JSON.parse( body );
      cb( request, function( err, json ) {
	//console.log( err, json );
	if ( err ) {
	  response.statusCode = 400;
	  response.end( err.toString() );
	}
	else {
	  response.statusCode = 200;
	  response.setHeader('Content-Type', 'application/json');
	  response.write( JSON.stringify( json, null, 2 ) );
	  response.end();
	}
      });
    });
  }
  var server = http.createServer( handleRequest );
  server.listen( port || 8080, function(){
    console.log( 'server listening on: http://localhost:' + (port || 8080) );
  });
}

// When Gamesparks is ready...
function onReady() {

  // Remember the last authenticated playerId
  var playerIds = {};
  var lastId;

  // Set up a CTRL-C signal handler to disconnect users when this server quits
  process.on( 'SIGINT', function() {
    async.eachSeries( Object.keys( playerIds ), function( username, cb ) {
      console.log( 'disconnecting:', username );
      gameSparks.sendAs( playerIds[ username ], '.EndSessionRequest', null, cb );
    }, function( err ) {
      if ( err ) console.log( err );
      process.exit(0);
    });
  });
  
  // Run our mini http server
  server( port, function( req, cb ) {

    // This is what we expect
    var requestType = req.body.requestType;
    var data = req.body.data || {};
    var playerId = playerIds[ req.body.username ] || lastId;
    
    // New auth ... 
    // if ( requestType == ".AuthenticationRequest" ) playerId = null;

    // Send it to Gamesparks
    console.log( playerId, requestType, JSON.stringify( data ) );
    gameSparks.sendAs( playerId, requestType, data, function( err, res ) {
      if ( err ) cb( err );
      else {
	if ( requestType == ".AuthenticationRequest" ) {
	  // New auth ...
	  // playerId = res.userId;
	  playerIds[ data.userName ] = res.userId;
	  lastId = res.userId;
	}
	// Send result back to client
	cb( null, res );
      }
    });
  });
}

// When async messages arrive from Gamesparks ...
function onMessage( msg ) {
  console.log( '------------------------------------------' );
  console.log( 'received a message:', JSON.stringify( msg, null, 2 ) );
}

// Gamesparks connection errors
function onError( err ) {
  console.log( '[fatal]', err );
  process.exit(1);
}

// Init the SDK and go!
gameSparks.initPreviewListener( config.gameApiKey, config.secret, 10, onMessage, onReady, onError );

