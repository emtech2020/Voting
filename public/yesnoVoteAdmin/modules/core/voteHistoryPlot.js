//adapted from https://gist.github.com/benjchristensen/1148374
function VoteHistoryPlot(brain) {

	var self = this;
	var voteData = [];
	var VOTE_DATA_HISTORY_SIZE = 51;
	var VOTE_DATA_INIT_VALUE = 50;
	var newVoteDatum = VOTE_DATA_INIT_VALUE;
	var svg;
	var x;
	var y;
	var voteHistoryPlotContainer;
	var voteBallPit;
	var PLOT_HEIGHT = "35%";
	var OFFSCREEN_OFFSET = 10; // This hides the new data animation jump when laterally sliding the plot

	self.init = function() {
		self.createVoteData();
		self.createPlot();
		voteBallPit = document.querySelector("#voteBallPit");
		/*console.log(chrome);
		console.log(chrome.app);
		console.log(chrome.app.isInstalled);
		console.log(chrome.app.runningState);
		chrome.app.window.current().onBoundsChanged.addListener(self.onWindowResize);*/
		self.createCurrentVotePoller();
	};

	self.createVoteData = function() {
		for (var i=0; i<VOTE_DATA_HISTORY_SIZE; i++) {
			voteData.push(VOTE_DATA_INIT_VALUE);
		}
	};

	self.createPlot = function() {
	  voteHistoryPlotContainer = document.querySelector("#voteHistoryPlotContainer");
		var id = "#voteHistoryPlot";
		var width = voteHistoryPlotContainer.offsetWidth + OFFSCREEN_OFFSET;
		var height = voteHistoryPlotContainer.offsetHeight;
		var interpolation = "basis";
		var animate = true;
		var updateDelay = 1000;
		var transitionDelay = 1000;
		var data = voteData;

		// create an SVG element inside the #graph div that fills 100% of the div
		svg = d3.select(id).append("svg:svg");
		// set the dimensions
		svg.attr("width", width).attr("height", height);

		// X scale will fit values from 0-10 within pixels 0-100
		x = d3.scale.linear().domain([0, 48]).range([-OFFSCREEN_OFFSET, width]); // starting point is -5 so the first value doesn't show and slides off the edge as part of the transition
		// Y scale will fit values from 0-100 within pixels 0-100
		y = d3.scale.linear().domain([0, 100]).range([height, 0]);

		// create a line object that represents the SVN line we're creating
		var line = d3.svg.line()
			// assign the X function to plot our line as we wish
			.x(function(d,i) { 
				// verbose logging to show what's actually being done
				//console.log('Plotting X value for data point: ' + d + ' using index: ' + i + ' to be at: ' + x(i) + ' using our xScale.');
				// return the X coordinate where we want to plot this datapoint
				return x(i); 
			})
			.y(function(d) { 
				// verbose logging to show what's actually being done
				//console.log('Plotting Y value for data point: ' + d + ' to be at: ' + y(d) + " using our yScale.");
				// return the Y coordinate where we want to plot this datapoint
				return y(d); 
			})
			.interpolate(interpolation);
	
			// display the line by appending an svg:path element with the data line we created above
			svg.append("svg:path").attr("d", line(data));
			// or it can be done like this
			//svg.selectAll("path").data([data]).enter().append("svg:path").attr("d", line);
			
			
		function redrawWithAnimation() {
			// update with animation
			svg.selectAll("path")
				.data([data]) // set the new data
				.attr("transform", "translate(" + x(1) + ")") // set the transform to the right by x(1) pixels (6 for the scale we've set) to hide the new value
				.attr("d", line) // apply the new data values ... but the new value is hidden at this point off the right of the canvas
				.transition() // start a transition to bring the new value into view
				.ease("linear")
				.duration(transitionDelay) // for this demo we want a continual slide so set this to the same as the setInterval amount below
				.attr("transform", "translate(" + x(0) + ")"); // animate a slide to the left back to x(0) pixels to reveal the new value
				
				/* thanks to 'barrym' for examples of transform: https://gist.github.com/1137131 */
		}
			
		function redrawWithoutAnimation() {
			// static update without animation
			svg.selectAll("path")
				.data([data]) // set the new data
				.attr("d", line); // apply the new data values
		}
			
		setInterval(function() {
		   data.shift();
		   data.push(newVoteDatum);
		   if(animate) {
			   redrawWithAnimation();
			} else {
			  redrawWithoutAnimation();
			}
		}, updateDelay);
	};
	
	self.createCurrentVotePoller = function() {
	  setInterval(self.pollCurrentVote, 1000);
	}
	
	
	///////////////////////////////////
  // callbacks
  ///////////////////////////////////
	
	self.onWindowResize = function(event) {
	  voteHistoryPlotContainer.style.width = voteBallPit.offsetWidth + OFFSCREEN_OFFSET + "px";
	  voteHistoryPlotContainer.style.height = PLOT_HEIGHT;
	  voteHistoryPlotContainer.style.left = -(2*OFFSCREEN_OFFSET).toString() + "px";
	  voteHistoryPlotContainer.style.top = voteBallPit.offsetHeight/2 - voteHistoryPlotContainer.offsetHeight/2 + "px";
	  
	  var width = voteHistoryPlotContainer.offsetWidth + OFFSCREEN_OFFSET;
		var height = voteHistoryPlotContainer.offsetHeight;
		x = d3.scale.linear().domain([0, 48]).range([-OFFSCREEN_OFFSET, width]);
		y = d3.scale.linear().domain([0, 100]).range([height, 0]);
		svg.attr("width", width).attr("height", height);
	};
	
	
	///////////////////////////////////
  // utilities
  ///////////////////////////////////
  
	self.pollCurrentVote = function() {
	  var yesMinusNoNormalizedVote = brain.getVoteManager().getVoteRoomScreen().getVoteBallPit().getYesMinusNoNormalizedVote();
	  // Map the normalized value from [-1, 1] to [0, 100]
	  var domainAMin = -1;
	  var domainAMax = 1;
	  // Add buffer so that the plot line is not visually clipped
	  var buffer = 5;
	  var domainBMin = 0  + buffer;
	  var domainBMax = 100 - buffer;
	  newVoteDatum = ((yesMinusNoNormalizedVote - domainAMin) / (domainAMax - domainAMin)) * (domainBMax - domainBMin) + domainBMin;
	}

  self.reset = function() {
    for (var i=0; i<voteData.length; i++) {
      voteData[i] = VOTE_DATA_INIT_VALUE;
    }
  };


	self.init();
}
