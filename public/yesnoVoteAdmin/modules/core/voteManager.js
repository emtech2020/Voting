function VoteManager(brain) {

	var self = this;
	var voteRoomCreatorScreen;
	var voteRoomScreen;

	self.init = function() {
	  self.createVoteRoomCreatorScreen();
	  self.createVoteRoomScreen();
	};
	
	self.createVoteRoomCreatorScreen = function() {
    voteRoomCreatorScreen = new VoteRoomCreatorScreen(brain);
	};
	
	self.createVoteRoomScreen = function() {
    voteRoomScreen = new VoteRoomScreen(brain);
	};


  ///////////////////////////////////
  // accessors
  ///////////////////////////////////
  
  self.getVoteRoomCreatorScreen = function() { return voteRoomCreatorScreen; };
  self.getVoteRoomScreen = function() { return voteRoomScreen; };
  
  
  ///////////////////////////////////
  // callbacks
  ///////////////////////////////////

	self.onVoteUrlCreated = function(voteUrl) {
	  console.log("onVoteUrlCreated", voteUrl);
	  voteRoomInput.value = "";
	  var voteRoom;
    var voteUrlSplit = voteUrl.split("/");
    if (voteUrlSplit.length > 0) {
      voteRoom = voteUrlSplit[voteUrlSplit.length-1];
    }
	  self.getVoteRoomScreen().onVoteRoomCreated(voteRoom);
	  brain.getBeaconManager().broadcastUrl(voteUrl);
	  self.transitionToVoteRoomScreen();
	};

  self.onVoteReceived = function(socketId, vote, normalizedX, normalizedY, touchType) {
    self.getVoteRoomScreen().getVoteBallPit().onVoteReceived(socketId, vote, normalizedX, normalizedY, touchType);
  };
	
	self.onMobileClientSocketDisconnected = function(socketId) {
	  //console.log("onMobileClientSocketDisconnected", socketId);
    self.getVoteRoomScreen().getVoteBallPit().onMobileClientSocketDisconnected(socketId);
	};
	
	self.onMobileClientSocketConnected = function(socketId) {
	  //console.log("onMobileClientSocketConnected", socketId);
    self.getVoteRoomScreen().getVoteBallPit().onMobileClientSocketConnected(socketId);
	};
	
	self.onVoteRoomScreenBackButtonClicked = function() {
	  self.transitionToVoteRoomCreatorScreen();
	};
	
	
	///////////////////////////////////
  // utilities
  ///////////////////////////////////
	
	self.transitionToVoteRoomScreen = function() {
    self.getVoteRoomCreatorScreen().hide();
    self.getVoteRoomScreen().show();
	};
	
  self.transitionToVoteRoomCreatorScreen = function() {
    self.getVoteRoomScreen().hide();
    self.getVoteRoomCreatorScreen().show();
  };


  
	self.init();
}




























































