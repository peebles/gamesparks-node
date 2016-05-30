var crypto = require('crypto');
var WebSocketClient = require('./GameSparksWebSocketClient').WebSocket;

exports.socket = function() {
	var appSecret;
	var socketUrl;
	var locatorUrl;
	var initialised;
	var connected;
	var error;
	var closing;

	var initCallback;
	var messageCallback;
	var errorCallback;

	var webSocket;

	var debug;

	var socketNumber;

	var pendingRequests = {};
	
	var requestCount = 0;

	this.init = function(options) {
		socketUrl = options.url;
		locatorUrl = options.url;
		appSecret = options.secret;
		initCallback = options.onInit;
		messageCallback = options.onMessage;
		errorCallback = options.onError;
		debug = options.debug;
		socketNumber = options.socketNumber;

		initialised = false;
		connected = false;
		error = false;
		closing = false;
		cleanup();
		connect();
	};

	this.send = function(requestType, onResponse) {
		this.sendWithData(requestType, {}, onResponse);
	};

	this.ready = function() {
		if (debug) {
			console.log("I am ready");
		}
		return connected;
	};

	this.sendWithData = function(requestType, json, onResponse) {

		if (!initialised) {
			onResponse({
				error : "NOT_INITIALISED"
			});
			return;
		}
		if (requestType.indexOf('.') !== 0) {
			requestType = "." + requestType;
		}
		json["@class"] = requestType;

		json.requestId = (new Date()).getTime() + "_" + (++requestCount);
		
		//Reset the counter when it gets to 10000
		//Assumption here is we won't send this many in a millisecond :)
		if(requestCount > 10000){
			requestCount = 0;
		}

		if (onResponse) {
			pendingRequests[json.requestId] = onResponse;
			setTimeout(function() {
				if (pendingRequests[json.requestId]) {
					pendingRequests[json.requestId]({
						error : "NO_RESPONSE"
					});
				}
			}, 10000);
		}

		var requestString = JSON.stringify(json);
		if (debug) {
			console.log("WebSocket send: " + requestString);
		}
		webSocket.send(requestString);
	};

	this.close = function() {
		cleanup();
	};

	function cleanup() {
		connected = false;
		if (webSocket) {
			webSocket.onClose = null;
			webSocket.close();
		}
	}

	function getWebSocket(location) {
		return new WebSocketClient(location);
	}

	function connect() {
		webSocket = getWebSocket(socketUrl);
		webSocket.onopen = onWebSocketOpen;
		webSocket.onclose = onWebSocketClose;
		webSocket.onerror = onWebSocketError;
		webSocket.onmessage = onWebSocketMessage;
	}

	function onWebSocketError(error) {
		
		//On Windows / Azure there is a chance we get an ECONNRESET as well as a close.
		if(error && error.code === "ECONNRESET"){
			return;
		}
		
		socketUrl = locatorUrl;
		connected = false;
		
		if (errorCallback && !initialised) {
			if (debug) {
				console.log('WebSocket onError:' + JSON.stringify(error));
			}
			errorCallback(error);
		}
		error = true;
	}

	function onWebSocketClose(closeEvent) {
		connected = false;
		
		if (!error && !initialised) {
			connect();
		} else {
			if (debug) {
				console.log('WebSocket onClose executed ' + closeEvent);
			}
		}
	}

	function onWebSocketOpen() {
		connected = true;
		if (debug) {
			console.log('WebSocket onOpen: Connected ');
		}
	}

	function onWebSocketMessage(message) {

		var messageData = message.data;

		if (debug) {
			console.log('WebSocket onMessage: ' + messageData);
		}

		var result;

		try {
			result = JSON.parse(messageData);
		} catch (e) {
			console.log("An error ocurred while parsing the JSON Data: "
					+ message + "; Error: " + e);
			return;
		}

		var resultType = result['@class'];

		if (resultType === ".AuthenticatedConnectResponse") {
		    handshake(result);
		} else if (resultType.match(/Response$/)) {
			if (result.requestId) {
				var requestId = result.requestId;
				if (pendingRequests[requestId]) {
					pendingRequests[requestId](result);
					pendingRequests[requestId] = null;
				}
			}
		} else {
			messageCallback(result);
		}
	}

	function handshake(result) {
		if (result.connectUrl) {
			socketUrl = result.connectUrl;
			return;
		} else if (result.nonce) {
			var toSend = {
				"@class" : ".AuthenticatedConnectRequest",
				hmac : crypto.createHmac('SHA256', appSecret).update(
						result.nonce).digest('base64')
			};
			toSend.platform = "node-js";
			toSend.os = "node-js";
			webSocket.send(JSON.stringify(toSend));
			return;
		} else if (result.sessionId) {
			initialised = true;
			if (initCallback) {
				initCallback();
			}
		} else if (result.error) {
		    var report_error = new Error(JSON.stringify(result.error) + " during handshake, check secret ");
		    if (errorCallback) {
		        errorCallback(report_error);
		    }
		    else {
		        throw report_error;
		    }
		}
	}
};
