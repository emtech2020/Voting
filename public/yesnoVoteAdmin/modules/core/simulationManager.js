function SimulationManager() {
  
  var self = this;
  var amSimulating = false;
  var amShowingSimulationControlsContainer = false;
  var simulationControlsContainer;
  var numSimulatedClientsSlider;
  var simulationToggle;
  var simulationCheckbox;
  var VOTE_SIMULATION_INTERVAL = 15000;
  var simulateVotingTimeoutId;
  
  self.init = function() {
    self.initSimulationControls();
  };
  
  self.initSimulationControls = function() {
    simulationControlsContainer = document.querySelector("#simulationControlsContainer");
    TweenLite.set(simulationControlsContainer, {
      opacity: 0
    });
    numSimulatedClientsSlider = document.querySelector("#numSimulatedClientsSlider");
    numSimulatedClientsSlider.addEventListener("change", self.onNumSimulatedClientsSliderChange);
    simulationToggle = document.querySelector("#simulationToggle");
    simulationToggle.addEventListener("change", self.onSimulationToggleChange);
    simulationCheckbox = document.querySelector("#simulationCheckbox");
    window.addEventListener("keyup", self.onWindowKeyUp);
  };


  ///////////////////////////////////
  // callbacks
  ///////////////////////////////////
  
  self.onNumSimulatedClientsSliderChange = function(event) {
    var numMobileClientsToSimulate = numSimulatedClientsSlider.value;
    var voteBalls = brain.getVoteManager().getVoteRoomScreen().getVoteBallPit().getVoteBalls();
    var currentNumMobileClients = voteBalls.length;
    
    if (currentNumMobileClients < numMobileClientsToSimulate) {
      var numExtraMobileClientsNeeded = numMobileClientsToSimulate - currentNumMobileClients;
      for (var i=0; i<numExtraMobileClientsNeeded; i++) {
        var delay = parseInt(Math.random() * 3000);
        setTimeout(brain.getSocketManager().sendCreateFakeMobileClientMessageToServer, delay);
      }
    } else {
      var numMobileClientsToDelete = currentNumMobileClients - numMobileClientsToSimulate;
      var startIndex = voteBalls.length-1;
      var stopIndex = startIndex - numMobileClientsToDelete;
      for (var j=startIndex; j>=stopIndex; j--) {
        var delay = parseInt(Math.random() * 3000);
        var voteBall = voteBalls[j];
        var socketId = voteBall.getSocketId();
        setTimeout(brain.getVoteManager().deleteVoteBall, delay, voteBall);
        setTimeout(brain.getSocketManager().sendDeleteFakeMobileClientMessageToServer, delay, socketId);
      }
    }
  };
  
  self.onWindowKeyUp = function(event) {
    if (event.keyCode === 18) {
      self.toggleSimulationControlsContainerVisibility();
    }
  };
  
  self.onSimulationToggleChange = function(event) {
    if (event.srcElement.checked === true) {
      self.enableSimulation();
    } else {
      self.disableSimulation();
    }
  };
  
  
  ///////////////////////////////////
  // utilities
  ///////////////////////////////////
  
  self.enableSimulation = function() {
    if (amSimulating === true) {
      return;
    }
    amSimulating = true;
    self.simulateVoting();
  };
  
  self.disableSimulation = function() {
    if (amSimulating === false) {
      return;
    }
    amSimulating = false;
  };
  
  self.simulateVoting = function() {
    if (amSimulating === true) {
      simulateVotingTimeoutId = setTimeout(self.simulateVoting, VOTE_SIMULATION_INTERVAL);
    } else {
      return;
    }
    
    var voteBalls = brain.getVoteManager().getVoteRoomScreen().getVoteBallPit().getVoteBalls();
    var numVoteBalls = voteBalls.length;
    var numVotesToSimulate = Math.floor(Math.random() * numVoteBalls);
    var threshold = Math.random();
    for (var i=0; i<numVotesToSimulate; i++) {
      var randIndex = Math.floor(Math.random() * numVoteBalls);
      var voteBall = voteBalls[randIndex];
      var socketId = voteBall.getSocketId();
      var delay = (Math.random() * VOTE_SIMULATION_INTERVAL/2);
      var vote = "no";
      if (Math.random() >= threshold) {
        vote = "yes";
      }
      //setTimeout(brain.getSocketManager().sendSimulateVoteMessage, delay, socketId, vote);
      setTimeout(self.sendSimulateVoteMessage, delay, socketId, vote);
    }
  };
  
  self.sendSimulateVoteMessage = function(delay, socketId, vote) {
    if (amSimulating == false) {
      return;
    }
    brain.getSocketManager().sendSimulateVoteMessage(delay, socketId, vote);
  }
  
  self.reset = function() {
    clearTimeout(simulateVotingTimeoutId);
    if (simulationCheckbox.checked === true) {
      simulationToggle.click();
    }
    numSimulatedClientsSlider.MaterialSlider.change(1);
  };
  
  self.toggleSimulationControlsContainerVisibility = function() {
    if (amShowingSimulationControlsContainer === false) {
      self.showSimulationControlsContainer();
    } else {
      self.hideSimulationControlsContainer();
    }
  };
  
  self.showSimulationControlsContainer = function() {
    if (amShowingSimulationControlsContainer === true) {
      return;
    }
    amShowingSimulationControlsContainer = true;
    TweenLite.to(simulationControlsContainer, .6, {
      opacity: 1,
      ease: Quint.easeOut
    });
  };
  
  self.hideSimulationControlsContainer = function() {
    if (amShowingSimulationControlsContainer === false) {
      return;
    }
    amShowingSimulationControlsContainer = false;
    TweenLite.to(simulationControlsContainer, .6, {
      opacity: 0,
      ease: Quint.easeOut
    });
  };
  
  self.pause = function() {

  };
  
  self.play = function() {
    
  }

  
  self.init();
}