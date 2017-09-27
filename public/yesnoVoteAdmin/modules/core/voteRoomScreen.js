function VoteRoomScreen(brain) {
  
  var self = this;
  var voteRoomScreen;
  var backButton;
  var refreshButton;
  var pauseButton;
  var pauseButtonImage;
  var voteRoomText;
  var votesContainer;
  var numNoVotesText;
  var numYesVotesText;
  var voteBallPit;
  var voteRoom = null;
  var voteRoomInput;
  var VOTE_CONTAINER_Y_OFFSET = 100;
  var amPaused = false;
  
  self.init = function() {
    voteRoomScreen = document.querySelector("#voteRoomScreen");
	  backButton = document.querySelector("#backButton");
	  backButton.addEventListener("click", self.onBackButtonClick);
	  refreshButton = document.querySelector("#refreshButton");
	  refreshButton.addEventListener("click", self.onRefreshButtonClick);
	  pauseButton = document.querySelector("#pauseButton");
	  pauseButton.addEventListener("click", self.onPauseButtonClick);
	  pauseButtonImage = document.querySelector("#pauseButtonImage");
	  voteRoomText = document.querySelector("#voteRoomText");
	  votesContainer = document.querySelector("#votesContainer");
	  numNoVotesText = document.querySelector("#numNoVotesText");
	  numYesVotesText = document.querySelector("#numYesVotesText");
	  voteRoomInput = document.querySelector("#voteRoomInput");
	  voteBallPit = new VoteBallPit(brain);
	  //chrome.app.window.current().onBoundsChanged.addListener(self.onWindowResize);
	  self.onWindowResize();
  };
  
  
  ///////////////////////////////////
  // accessors
  ///////////////////////////////////
  
  self.getVoteRoom = function() { return voteRoom; };
  self.getVoteBallPit = function() { return voteBallPit; };
  
  
  ///////////////////////////////////
  // callbacks
  ///////////////////////////////////
  
  self.onWindowResize = function() {
    var newHeight =  window.innerHeight - VOTE_CONTAINER_Y_OFFSET;
    var newY = VOTE_CONTAINER_Y_OFFSET;
    TweenLite.set(votesContainer, {
      height: newHeight,
      y: newY
    });
    
    if (voteRoomInput.offsetWidth != 0) {
      voteRoomText.style.width = voteRoomInput.offsetWidth + "px";
      voteRoomText.style.height = voteRoomInput.offsetHeight + "px";
    }
  };
  
  self.onVoteRoomCreated = function(newVoteRoom) {
    console.log("onVoteRoomCreated", newVoteRoom);
    voteRoom = newVoteRoom;
    voteRoomText.textContent = newVoteRoom;
  };
  
  self.onBackButtonClick = function(event) {
    brain.getSimulationManager().reset();
    self.getVoteBallPit().reset();
    brain.getVoteManager().onVoteRoomScreenBackButtonClicked();
  };
  
  self.onRefreshButtonClick = function(event) {
    brain.getSimulationManager().reset();
    self.getVoteBallPit().refresh();
  }
  
  self.onPauseButtonClick = function(event) {
    if (amPaused == true) {
      amPaused = false;
      pauseButtonImage.src = "assets/pause.png";
      brain.getSimulationManager().play();
      self.getVoteBallPit().play();
    } else {
      amPaused = true;
      pauseButtonImage.src = "assets/play.png";
      brain.getSimulationManager().pause();
      self.getVoteBallPit().pause();
    }

  }

	///////////////////////////////////
  // utilities
  ///////////////////////////////////

  self.show = function() {
    console.log("show voteRoomScreen");
    voteRoomScreen.style.display = "block";
    
    voteBallPit.onWindowResize();
	  
	  TweenLite.fromTo(backButton, .6, {
	    opacity:0
	  },{
	    opacity: 1,
	    ease:Quint.easeOut
	  });
	  
	  var newTop = 50;
	  TweenLite.fromTo(voteRoomText, .6, {
	    top: voteRoomInput.style.top,
	    opacity: 1
	  }, {
	    top: newTop,
	    opacity: 1,
	    ease:Quint.easeOut
	  });
	  
	  TweenLite.fromTo(votesContainer, .6, {
	    opacity: 0
	  }, {
	    opacity: 1,
	    ease: Quint.easeOut
	  })
  };

  self.hide = function() {
    console.log("hide voteRoomScreen");
	  TweenLite.to(backButton, .6, {
	    opacity: 0,
	    ease:Quint.easeOut
	  });
	  
	  var newY = -voteRoomScreen.offsetHeight/2 + 50;
	  TweenLite.to(voteRoomText, .6, {
	    opacity: 0,
	    ease:Quint.easeOut
	  });
	  
	  brain.getSimulationManager().hideSimulationControlsContainer();

	  TweenLite.to(votesContainer, .6, {
	    opacity: 0,
	    ease: Quint.easeOut,
	    onComplete: function() {
	      voteRoomScreen.style.display = "none";
	    }
	  });
  };
  

  
  
  self.init();
}
