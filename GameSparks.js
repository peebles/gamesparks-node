var GameSparksAdminSocket = new require('./GameSparksAdminSocket').socket;
var poolModule = require('./generic-pool');

var pool = null;
var socketNumber = 0;
var inited = false;

function initSender(url, secret, socketCount, onMessage, onInit, onSocketError) {
  if(pool !== null){
    console.log("GameSparks already initialised");
    return;
  }
  pool = poolModule.Pool({
    name : 'gamesparks',
    create : function(callback) {
      socketNumber += 1;
      var gameSparksAdminSocket = new GameSparksAdminSocket();
      gameSparksAdminSocket.init({
	url : url,
	secret : secret,
	onInit : function() {
	  callback(null, gameSparksAdminSocket);
	  if ( ! inited ) {
	    inited = true;
	    onInit();
	  }
	},
	onError : function (error) {
	  if (onSocketError) {
	    onSocketError(error);
	  }

          // Report to the pool that there was an error on this socket and it should throw it away
	  callback(error, gameSparksAdminSocket);
	},
	onMessage : function( msg ) {
	  if ( onMessage ) onMessage( msg );
	},
	debug : false,
	socketNumber: socketNumber
      });
    },
    destroy : function(gameSparksAdminSocket) {
      gameSparksAdminSocket.close();
    },
    validate : function(gameSparksAdminSocket) {
      return gameSparksAdminSocket.ready();
    },
    max : socketCount,
    min : 10,
    idleTimeoutMillis : 30000,
    log: false,
    refreshIdle : false
  });
}

exports.init = function(url, secret, socketCount, onInit, onError){
  initSender(url, secret, socketCount, null, onInit, onError);
};

exports.initLiveSender = function(gameApiKey, secret, socketCount, onInit, onError){
  initSender("wss://service.gamesparks.net/ws/server-send/" + gameApiKey, secret, socketCount, null, onInit, onError);
};

exports.initLiveListener = function(gameApiKey, secret, socketCount, onMessage, onInit, onError){
  initSender("wss://service.gamesparks.net/ws/server/" + gameApiKey, secret, socketCount, onMessage, onInit, onError);
};

exports.initPreviewSender = function(gameApiKey, secret, socketCount, onInit, onError){
  initSender("wss://preview.gamesparks.net/ws/server-send/" + gameApiKey, secret, socketCount, null, onInit, onError);
};

exports.initPreviewListener = function(gameApiKey, secret, socketCount, onMessage, onInit, onError){
  initSender("wss://preview.gamesparks.net/ws/server/" + gameApiKey, secret, socketCount, onMessage, onInit, onError);
};

var sendAs = function( playerId, requestType, data, cb ) {
  if ( pool == null ) return cb( new Error( 'Pool not initialised' ) );

  if(data == null) {
    data = {};
  }
  if ( playerId ) data.playerId = playerId;
  
  pool.acquire(function(err, client) {
    if ( err ) return cb( err );
    client.sendWithData(requestType, data, function(response) {
      pool.release(client);
      cb( null, response );
    });
  });
};

// A more node-standard way of making calls.
exports.sendAs = sendAs;

// The previously published API
exports.sendAsDepricated = function( playerId, requestType, data, onResponse, onError ) {
  sendAs( playerId, requestType, data, function( err, response ) {
    if ( err ) onError( err );
    else onResponse( response );
  });
};

