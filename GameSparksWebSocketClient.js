/**
 * New node file
 */
var WebSocketClient = require('./WorlizeWebSocketNode/websocket').client;

exports.WebSocket = function(uri) {

	var self = this;

	this.connection = null;

	this.socket = new WebSocketClient({
		keepalive : true,
		keepaliveInterval : 20000,
		dropConnectionOnKeepaliveTimeout : true,
		keepaliveGracePeriod : 5000
	});

	this.socket.on('connectFailed', function(errorDescription) {
	    self.onerror("general connection failure\n" + errorDescription + "\n" + (new Error().stack.toString()));
	});
	
	this.socket.on('handshakeFailed', function(errorDescription) {
	    self.onerror("handshake failed\n" + errorDescription + "\n" + (new Error().stack.toString()));
	});
	
	this.socket.on('securityFailed', function(errorDescription) {
	    self.onerror("connect failed, check apiKey\n" + errorDescription + "\n" + (new Error().stack.toString()));
	});
	
	this.socket.on('connect', function(connection) {
		self.connection = connection;

		connection.on('error', function(error) {
			self.onerror(error);
		});

		connection.on('close', function() {
			self.onclose();
		});

		connection.on('message', function(message) {
			if (message.type === 'utf8') {
				self.onmessage({
					data : message.utf8Data
				});
			}
		});

		self.onopen();
	});
	this.socket.connect(uri);
};

exports.WebSocket.prototype.send = function(data) {
	this.connection.sendUTF(data);
};

exports.WebSocket.prototype.close = function() {
	this.connection.close();
};
