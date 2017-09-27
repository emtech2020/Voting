function VoteRoomCreatorScreen(brain) {
  
  var self = this;
  var voteRoomCreatorScreen;
  var voteRoomEntryFormContainer;
  var voteRoomInput;
  var createVoteRoomButton;
  
  self.init = function() {
    voteRoomCreatorScreen = document.querySelector("#voteRoomCreatorScreen");
	  voteRoomEntryFormContainer = document.querySelector("#voteRoomEntryFormContainer");
		voteRoomInput = document.querySelector("#voteRoomInput");
		voteRoomInput.addEventListener("keyup", self.onVoteRoomInputKeyup);
	  createVoteRoomButton = document.querySelector("#createVoteRoomButton");
	  createVoteRoomButton.disabled = true;
	  createVoteRoomButton.addEventListener("click", self.onCreateVoteRoomButtonClick);
  };
  
  
  ///////////////////////////////////
  // callbacks
  ///////////////////////////////////

  self.onVoteRoomInputKeyup = function(event) {
	  var enteredText = voteRoomInput.value;
    if (self.checkIfRoomNameIsValid(enteredText) === false) {
      createVoteRoomButton.disabled = true;
      return;
    }

	  if (enteredText.length > 0) {
	    createVoteRoomButton.disabled = false;
	  } else {
	    createVoteRoomButton.disabled = true;
	  }
		// If the enter key was pressed
		if (event.keyCode == 13) {
		  event.preventDefault();
			self.requestVoteRoom();
		}
	};
	
	self.onCreateVoteRoomButtonClick = function(event) {
	  self.requestVoteRoom();
	};
	
	
	///////////////////////////////////
  // utilities
  ///////////////////////////////////

	// TODO: run this check via regex
	self.checkIfRoomNameIsValid = function(roomName) {
	  var validUrlCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~:?#[]@!$&';
    for (var i=0; i<roomName.length; i++) {
      var character = roomName[i];
      if (validUrlCharacters.indexOf(character) == -1) {
        return false;
      }
    }
    return true;
	};
	
  self.requestVoteRoom = function() {
    voteRoom = voteRoomInput.value;
		brain.getSocketManager().sendVoteRoomToServer(voteRoom);
  };
  
  self.show = function() {
    console.log("show voteRoomCreatorScreen");
    voteRoomCreatorScreen.style.display = "block";
    TweenLite.to(voteRoomCreatorScreen, .6, {
	    opacity: 1,
	    ease: Quint.easeOut,
	  });
  };

  self.hide = function() {
    console.log("hide voteRoomCreatorScreen");
    TweenLite.to(voteRoomCreatorScreen, .6, {
	    opacity:0,
	    ease: Quint.easeOut,
	    onComplete: function() {
	      voteRoomCreatorScreen.style.display = "none";
	    }
	  });
  };
  
  
  
  self.init();
}
