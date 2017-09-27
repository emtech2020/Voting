/*
voteManager.js

Manages vote logic and ui
Sends user votes to the server
*/


function VoteManager(brain) {

	var self = this;
	var voteYesButton;
	var noButton;
	var voteControls;

	self.init = function() {
		self.initVoteButtons();
	};

	// Initialize the buttons that allow the user to vote
	self.initVoteButtons = function() {
		//Refrence the controls container
		voteControls = document.querySelector("#voteControls");

		// Listen for touch and mouse events
		voteControls.addEventListener("touchstart", self.onVoteControlsTouchStart);
		voteControls.addEventListener("touchmove", self.onVoteControlsTouchMove);
		voteControls.addEventListener("touchend", self.onVoteControlsTouchEnd);

		voteControls.addEventListener("mousedown", self.onVoteControlsMouseDown);
		voteControls.addEventListener("mousemove", self.onVoteControlsMouseMove);
		voteControls.addEventListener("mouseup", self.onVoteControlsMouseUp);
	};


	///////////////////////////////////
	// callbacks
	///////////////////////////////////

	// Fires when a vote controls touch event starts
	self.onVoteControlsTouchStart = function(event) {
		// If there are no touches listed in the event, then exit
		if (event.touches.length < 1) {
			return;
		}
		// Get the touch position
		var touch = event.touches[0];
		var x = touch.pageX;
		var y = touch.pageY;
		// Normalize it based on the window dimensions
		var normalizedX = (x/window.innerWidth).toPrecision(3);
		var normalizedY = (y/window.innerHeight).toPrecision(3);
		// Figure out if the user voted yes or no based on where they touched
		var vote = self.determineVoteFromTouchPosition(normalizedX, normalizedY);
		// Tell the server about the vote
		var touchType = "s";
		brain.getSocketManager().sendVoteMessageToServer(vote, normalizedX, normalizedY, touchType);
	};

	// Fires when a vote controls touch move event occurs
	self.onVoteControlsTouchMove = function(event) {
		// If there are not touches listed in the event, then exit
		if (event.touches.length < 1) {
			return;
		}
		// Get the touch position
		var touch = event.touches[0];
		var x = touch.pageX;
		var y = touch.pageY;
		// Normalize it based on the window dimensions
		var normalizedX = (x/window.innerWidth).toPrecision(3);
		var normalizedY = (y/window.innerHeight).toPrecision(3);
		// Figure out if the user voted yes or no based on where they touched
		var vote = self.determineVoteFromTouchPosition(normalizedX, normalizedY);
		// Tell the server about the vote
		var touchType = "m";
		brain.getSocketManager().sendVoteMessageToServer(vote, normalizedX, normalizedY, touchType);
	};

	// Fires when a vote controls touch end event occurs
	self.onVoteControlsTouchEnd = function(event) {
		// If there are not touches listed in the event, then exit
		var touchType = "e";
		var touch = event.changedTouches[0];
		if (touch.length < 1) {
			return;
		}
		// Get the touch position
		var x = touch.pageX;
		var y = touch.pageY;
		// Normalize it based on the window dimensions
		var normalizedX = (x/window.innerWidth).toPrecision(3);
		var normalizedY = (y/window.innerHeight).toPrecision(3);
		// Figure out if the user voted yes or no based on where they touched
		var vote = self.determineVoteFromTouchPosition(normalizedX, normalizedY);
		// Tell the server about the vote
		var touchType = "e";
		brain.getSocketManager().sendVoteMessageToServer(vote, normalizedX, normalizedY, touchType);
	};

	// Fires when a vote controls mouse down event occurs
	self.onVoteControlsMouseDown = function(event) {
		// Simulate a touch start event at the given mouse down point
		// Get the mouse down position
		var x = event.pageX;
		var y = event.pageY;
		// Normalize it based on window dimensions
		var normalizedX = (x/window.innerWidth).toPrecision(3);
		var normalizedY = (y/window.innerHeight).toPrecision(3);
		// Figure out if the user voted yes or no based on where they touched
		var vote = self.determineVoteFromTouchPosition(normalizedX, normalizedY);
		// Tell the server about the vote
		var touchType = "s";
		brain.getSocketManager().sendVoteMessageToServer(vote, normalizedX, normalizedY, touchType);
	}

	// Fires when a vote controls mouse move event occurs
	self.onVoteControlsMouseMove = function(event) {
		// If a mouse button is depressed
		if (event.buttons) {
			// If the left click is depressed
			if (event.buttons == 1) {
				// Simulate a touch move event
				// Get the mouse move position
				var x = event.pageX;
				var y = event.pageY;
				// Normalize it based on window dimensions
				var normalizedX = (x/window.innerWidth).toPrecision(3);
				var normalizedY = (y/window.innerHeight).toPrecision(3);
				// Figure out if the user voted yes or no based on where they touched
				var vote = self.determineVoteFromTouchPosition(normalizedX, normalizedY);
				// Tell the server about the vote
				var touchType = "m";
				brain.getSocketManager().sendVoteMessageToServer(vote, normalizedX, normalizedY, touchType);
			}
		}
	}

	// Fires when a vote controls mouse up event occurs
	self.onVoteControlsMouseUp = function(event) {
		// Simulate a touch end event
		// Get the mouse up position
		var x = event.pageX;
		var y = event.pageY;
		// Normalize it based on window dimensions
		var normalizedX = (x/window.innerWidth).toPrecision(3);
		var normalizedY = (y/window.innerHeight).toPrecision(3);
		// Figure out if the user voted yes or no based on where they touched
		var vote = self.determineVoteFromTouchPosition(normalizedX, normalizedY);
		// Tell the server about the vote
		var touchType = "e";
		brain.getSocketManager().sendVoteMessageToServer(vote, normalizedX, normalizedY, touchType);
	}


	///////////////////////////////////
	// utilities
	///////////////////////////////////

	// Given the normalized position
	// figure out if the touch was op the top (yes vote)
	// or on the bottom (no vote)
	self.determineVoteFromTouchPosition = function(normalizedX, normalizedY) {
		if (normalizedY <= .5) {
			return "yes";
		} else {
			return "no";
		}
	};

	self.init();
}