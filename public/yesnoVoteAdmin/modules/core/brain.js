
function Brain() {
	
	var self = this;
	var voteManager;
	var socketManager;
	var simulationManager;
	var beaconManager;

	self.init = function() {
	  self.createVoteManager();
	  self.createSimulationManager();
		self.createSocketManager();
		self.createBeaconManager();
	};
	
  self.createVoteManager = function() {
    console.log("createVoteManager");
    voteManager = new VoteManager(self);
  };
  
  self.createSimulationManager = function() {
    console.log("createSimulationManager");
    simulationManager = new SimulationManager(self);
  };

	self.createSocketManager = function() {
	  console.log("createSocketManager");
		socketManager = new SocketManager(self);
	};
	
	self.createBeaconManager = function() {
	  console.log("createBeaconManager");
	  beaconManager = new BeaconManager(self);
	};


  self.getVoteManager = function() { return voteManager; };
  self.getSimulationManager = function() { return simulationManager; };
	self.getSocketManager = function() { return socketManager; };
	self.getBeaconManager = function() { return beaconManager; };
	

	self.init();
}













