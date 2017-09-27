/*
socketManager.js

Manages socket communication with the server
*/


function SocketManager(brain) {

	var self = this;
	var SERVER_SOCKET_URL = "http://localhost:54322";
	var socket;

	self.init = function() {
//		socket = io();
		socket = io.connect(SERVER_SOCKET_URL);
		socket.on("connect", self.onConnectionWithServer);
		socket.on("connect_failed", self.onConnectionFailedWithServer);
		socket.on("disconnect", self.onDisonnectionFromServer);
	};


	///////////////////////////////////
	// callbacks
	///////////////////////////////////

	// Fires when a socket connection with the server occurs
	self.onConnectionWithServer = function() {
		console.log("connected to server");
	};

	// Fires when the socket connection with the server fails
	self.onConnectionFailedWithServer = function() {
		console.log("connection to server failed");
	};

	// Fires when the socket connection with the server disconnects
	self.onDisonnectionFromServer = function() {
		console.log("disconnected from server");
	};


	///////////////////////////////////
	// utilities
	///////////////////////////////////

	// Send a message containing the user's current vote and
	// touch location on the screen, and touch type
	self.sendVoteMessageToServer = function(vote, normalizedX, normalizedY, touchType) {
		var message = {
			"v": vote,
			"x": normalizedX,
			"y": normalizedY,
			"t": touchType
		};
		self.sendMessageToServer("vote", message);
	};

	// Send a message of the given type and content to the server
	self.sendMessageToServer = function(messageType, message) {
		var json = JSON.stringify(message);
		console.log("sending message to server: " + messageType + "  " + json);
		socket.emit(messageType, message);
	};

	self.init();
}
