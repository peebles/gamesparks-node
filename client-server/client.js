try {
  var request = require( 'request' );
  var mod_getopt = require('posix-getopt');
} catch( err ) {
  console.log( 'Please "npm install request posix-getopt" before running this script!' );
  process.exit(1);
}

// defaults
var host = 'http://localhost:8080';

var cmd, event, type, username, password, data;

var Usage = [
  '  client.js [ --host URL ] --auth  --username USERNAME --password PASSWORD',
  '  client.js [ --host URL ] --event EVENT-KEY [ --username USERNAME ] < --data JSON-STRING or --file JSON-FILE >',
  '  client.js [ --host URL ] --type REQUEST-TYPE [ --username USERNAME ] < --data JSON-STRING or --file JSON-FILE >',
];

function exit( message ) {
  console.log( message );
  console.log( Usage.join( '\n' ) );
  process.exit(1);
}

// Parse options
var option;
var parser = new mod_getopt.BasicParser(
  'h:(host)a(auth)e:(event)t:(type)d:(data)f:(file)u:(username)p:(password)', process.argv );

while(( option = parser.getopt() ) !== undefined ) {
  switch( option.option ) {
    case 'h':
      host = option.optarg; break;
    case 'a':
      cmd = 'auth'; break;
    case 'e':
      cmd = 'event'; event = option.optarg; break;
    case 't':
      cmd = 'type'; type = option.optarg; break;
    case 'u':
      username = option.optarg; break;
    case 'p':
      password = option.optarg; break;
    case 'd':
      data = JSON.parse( option.optarg ); break;
    case 'f':
      data = require( option.optarg ); break;
    default:
      exit( 'Unknown option(s)' ); break;
  }
}

var url = host;

if ( ! cmd ) exit( 'Missing --auth or --event' );

if ( cmd == 'auth' ) {
  if ( ! ( username && password ) ) {
    exit( 'Missing --username and/or --password' );
  }

  request({
    url: url,
    method: 'POST',
    json: {
      requestType: '.AuthenticationRequest',
      data: {
	userName: username,
	password: password,
      }
    }
  }, function( err, res, body ) {
    if ( err ) { console.log( err ); process.exit(1); }
    if ( res.statusCode != 200 ) { console.log( body ); process.exit(1); }
    console.log( JSON.stringify( body, null, 2 ) );
    process.exit(0);
  });
}

if ( cmd == 'event' ) {
  if ( ! event ) exit( 'Missing eventKey' );
  if ( ! data ) exit( 'Missing --data or --file' );

  data = data || {};
  data.eventKey = event;

  request({
    url: url,
    method: 'POST',
    json: {
      requestType: '.LogEventRequest',
      username: username,
      data: data
    }
  }, function( err, res, body ) {
    if ( err ) { console.log( err ); process.exit(1); }
    if ( res.statusCode != 200 ) { console.log( body ); process.exit(1); }
    console.log( JSON.stringify( body, null, 2 ) );
    process.exit(0);
  });
}

if ( cmd == 'type' ) {
  if ( ! type ) exit( 'Missing requestType' );
  if ( ! data ) exit( 'Missing --data or --file' );

  request({
    url: url,
    method: 'POST',
    json: {
      requestType: type,
      username: username,
      data: data
    }
  }, function( err, res, body ) {
    if ( err ) { console.log( err ); process.exit(1); }
    if ( res.statusCode != 200 ) { console.log( body ); process.exit(1); }
    console.log( JSON.stringify( body, null, 2 ) );
    process.exit(0);
  });
}


