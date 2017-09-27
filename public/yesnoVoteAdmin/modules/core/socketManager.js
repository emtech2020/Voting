function SocketManager(brain) {

	var self = this;
	var SERVER_SOCKET_URL = "http://localhost:54321";
	var socket;

	self.init = function() {
		self.createSocket();
	};

	self.createSocket = function() {
		console.log("creating web socket");
		socket = io.connect(SERVER_SOCKET_URL);
		socket.on("connect", self.onConnectionWithServer);
		socket.on("connect_failed", self.onConnectionFailedWithServer);
		socket.on("disconnect", self.onDisonnectionFromServer);
		socket.on("voteUrlCreated", self.handleVoteUrlCreatedMessage);
		socket.on("vote", self.handleVoteMessage);
		socket.on("mobileClientSocketDisconnect", self.handleMobileClientSocketDisconnectMessage);
		socket.on("mobileClientSocketConnect", self.handleMobileClientSocketConnectMessage);
	};


	self.onConnectionWithServer = function() {
	  console.log("connected to server!");
	};

	self.onConnectionFailedWithServer = function() {
	  console.log("connection with server failed");
	};

	self.onDisonnectionFromServer = function() {
	  console.log("disconnected from server");
	};


	self.handleVoteUrlCreatedMessage = function(message) {
	  var voteUrl = message["voteUrl"];
		brain.getVoteManager().onVoteUrlCreated(voteUrl);
	};
	
	self.handleVoteMessage = function(message) {
	  var socketId = message["socketId"];
	  var vote = message["v"];
	  var normalizedX = message["x"];
	  var normalizedY = message["y"];
	  var touchType = message["t"];
	  brain.getVoteManager().onVoteReceived(socketId, vote, normalizedX, normalizedY, touchType);
	};
	
	self.handleMobileClientSocketDisconnectMessage = function(message) {
	  var socketId = message["socketId"];
	  brain.getVoteManager().onMobileClientSocketDisconnected(socketId);
	};
	
	self.handleMobileClientSocketConnectMessage = function(message) {
	  var socketId = message["socketId"];
	  brain.getVoteManager().onMobileClientSocketConnected(socketId);
	};

	self.sendVoteRoomToServer = function(voteRoom) {
		var message = {"voteRoom": voteRoom};
		self.sendMessageToServer("voteRoom", message);
	};
	
	self.sendCreateFakeMobileClientMessageToServer = function() {
	  var voteRoom = brain.getVoteManager().getVoteRoomScreen().getVoteRoom();
    if (voteRoom !== null) {
      var message = {"voteRoom": voteRoom};
      self.sendMessageToServer("createFakeMobileClient", message);
    }
	};
	
	self.sendDeleteFakeMobileClientMessageToServer = function(socketId) {
	  var voteRoom = brain.getVoteManager().getVoteRoomScreen().getVoteRoom();
    if (voteRoom !== null) {
      var message = {
        "voteRoom": voteRoom,
        "socketId": socketId
      };
      self.sendMessageToServer("deleteFakeMobileClient", message);
    }
	};
	
	self.sendSimulateVoteMessage = function(socketId, vote) {
	  var voteRoom = brain.getVoteManager().getVoteRoomScreen().getVoteRoom();
    if (voteRoom !== null) {
      var message = {
        "voteRoom": voteRoom,
        "socketId": socketId,
        "vote": vote
      };
      self.sendMessageToServer("simulateVote", message);
    }
	};

	self.sendMessageToServer = function(messageType, message) {
		var json = JSON.stringify(message);
		//console.log("sending message to server: " + messageType + "  " + json);
		socket.emit(messageType, message);
	};
	
	
	self.init();
}
