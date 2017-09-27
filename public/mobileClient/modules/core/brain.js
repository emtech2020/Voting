/*
brain.js

Top level manager that creates the singletons
that perform the core logic including
managing voting and
socket communication with the server
*/


function Brain() {
	
	var self = this;
	var voteManager;
	var socketManager;
	
	self.init = function() {
		self.createVoteManager();
		self.createSocketManager();
	};

	self.createVoteManager = function() {
		voteManager = new VoteManager(self);
	};
	
	self.createSocketManager = function() {
		socketManager = new SocketManager(self);
	};


	self.getVoteManager = function() { return voteManager; }
	self.getSocketManager = function() { return socketManager; }


	self.init();
}



















