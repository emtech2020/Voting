function VoteBallPit(brain) {
  
  var self = this;
  var voteBallPit;
  var socketIdToVoteBallMap = {};
  var noBin;
  var undecidedBin;
  var yesBin;
  var voteHistoryPlot;
  var NO_BIN_HEIGHT_PERCENTAGE = .49;
  var UNDECIDED_BIN_HEIGHT_PERCENTAGE = .02;
  var YES_BIN_HEIGHT_PERCENTAGE = .49;
  var YES_BIN_WINNING_BACKGROUND_COLOR = "rgba(100, 255, 218, .3)";
  var YES_BIN_WINNING_BORDER_COLOR = "rgba(100, 255, 218, 1)";
  var NO_BIN_WINNING_BACKGROUND_COLOR = "rgba(255, 64, 129, .2)";
  var NO_BIN_WINNING_BORDER_COLOR = "rgba(255, 64, 129, 1)";
  var BIN_LOSING_BACKGROUND_COLOR = "rgba(200, 200, 200, .2)";
  var BIN_LOSING_BORDER_COLOR = "rgba(0, 0, 0, 0)";
  var voteToSocketIdsMap = {"yes":[], "undecided": [], "no": []};
  var BIN_HEIGHT = "35%";
  var shade;
  
  self.init = function() {
    voteBallPit = document.querySelector("#voteBallPit");
    noBin = document.querySelector("#noBin");
    undecidedBin = document.querySelector("#undecidedBin");
    yesBin = document.querySelector("#yesBin");
    voteHistoryPlot = new VoteHistoryPlot(brain);
    shade = document.querySelector("#shade");
    //chrome.app.window.current().onBoundsChanged.addListener(self.onWindowResize);
  };
  

  ///////////////////////////////////
  // accessors
  ///////////////////////////////////

  self.getVoteBalls = function() { return Object.values(socketIdToVoteBallMap); };
  self.getYesMinusNoNormalizedVote = function() {
    // Output a value in [-1, 1];
    // -1 being max no votes, -1 being max yes votes
    var numYesVotes = voteToSocketIdsMap["yes"].length;
    var numNoVotes = voteToSocketIdsMap["no"].length;
    var totalVotes = numYesVotes + numNoVotes;
    var yesMinusNoNormalizedVote = 0;
    if (totalVotes > 0) {
      var normalizedYesVotes = numYesVotes/totalVotes;
      var normalizedNoVotes = numNoVotes/totalVotes;
      var yesMinusNoNormalizedVote = normalizedYesVotes - normalizedNoVotes;
    }
    return yesMinusNoNormalizedVote;
  };
  
  
  ///////////////////////////////////
  // callbacks
  ///////////////////////////////////
  
  self.onWindowResize = function() {
    var yesBinX = voteBallPit.offsetWidth/2;
    var yesBinY = (NO_BIN_HEIGHT_PERCENTAGE * voteBallPit.offsetHeight)/2;
    TweenLite.set(yesBin, {
      x: yesBinX,
      y: yesBinY,
      xPercent: -50,
      yPercent: -50,
    });
    
    var undecidedBinX = voteBallPit.offsetWidth/2;
    var undecidedBinY = voteBallPit.offsetHeight/2;
    TweenLite.set(undecidedBin, {
      x: undecidedBinX,
      y: undecidedBinY,
      xPercent: -50,
      yPercent: -50,
    });
    
    var noBinX = voteBallPit.offsetWidth/2;
    var noBinY = undecidedBinY + (NO_BIN_HEIGHT_PERCENTAGE * voteBallPit.offsetHeight)/2;
    TweenLite.set(noBin, {
      x: noBinX,
      y: noBinY,
      xPercent: -50,
      yPercent: -50,
    });
    
    self.updateBin(yesBin, "yes");
	  self.updateBin(noBin, "no");
	  self.updateVoteBalls();
    
    voteHistoryPlot.onWindowResize();
    
    TweenLite.set(shade, {
      width: voteBallPit.offsetWidth,
      height: voteBallPit.offsetHeight
    })
  };
	
  self.onVoteReceived = function(socketId, vote, normalizedX, normalizedY, touchType) {
    var voteBall = socketIdToVoteBallMap[socketId];
    if (voteBall === undefined) {
      return;
    }
    TweenLite.killTweensOf(voteBall);
    voteBall.setVote(vote);
    voteBall.enableHighlight();
    self.updateVoteCount(voteBall);
    if ((touchType == "s") || (touchType == "m")) {
      voteBall.setAmTouched(true);
      self.moveVoteBallToTouchPosition(voteBall, vote, normalizedX, normalizedY);
    } else if ((touchType == "e") || touchType === undefined) {
      voteBall.setAmTouched(false);
      voteBall.disableHighlight();
      if (vote == "yes") {
        self.moveVoteBallToBin(voteBall, yesBin);
      } else if (vote == "no") {
        self.moveVoteBallToBin(voteBall, noBin);
      }
    }
    self.updateBin(yesBin, "yes");
    self.updateBin(noBin, "no");
    self.updateVoteBalls();
  };
  
	self.onMobileClientSocketDisconnected = function(socketId) {
	  var voteBall = socketIdToVoteBallMap[socketId];
	  if (voteBall !== null) {
      self.deleteVoteBall(voteBall);
	  }
	};
	
	self.onMobileClientSocketConnected = function(socketId) {
	  var voteBall = self.createVoteBall(socketId);
	  self.addVoteBallToBallPit(voteBall);
	};
	
	self.onVoteBallVoteDecayed = function(voteBall) {
	  voteBall.setVote("undecided");
	  self.updateVoteCount(voteBall);
	  self.updateBin(yesBin, "yes");
	  self.updateBin(noBin, "no");
	  self.updateVoteBalls();
	  self.moveVoteBallToBin(voteBall, undecidedBin);
	};
	
	
  ///////////////////////////////////
  // utilities
  ///////////////////////////////////

	self.updateBin = function(bin, vote) {
	  var binBackgroundColor = self.determineBinBackgroundColor(bin);
    var binWidth = self.determineBinWidth(bin);
    var binBorderColor = self.determineBinBorderColor(bin);
    TweenLite.to(bin, .6, {
      width: binWidth,
      height: BIN_HEIGHT,
      xPercent: -50,
      yPercent: -50,
      backgroundColor: binBackgroundColor,
      borderColor: binBorderColor,
      ease: Quint.easeOut
    })
  };
  
	self.determineBinBackgroundColor = function(bin) {
	  var numYesVotes = voteToSocketIdsMap["yes"].length;
	  var numNoVotes = voteToSocketIdsMap["no"].length;
	  var yesBinBackgroundColor;
	  var noBinBackgroundColor;
	  if (numYesVotes > numNoVotes) {
      yesBinBackgroundColor = YES_BIN_WINNING_BACKGROUND_COLOR;
      noBinBackgroundColor = BIN_LOSING_BACKGROUND_COLOR;
	  } else if (numYesVotes < numNoVotes) {
	    yesBinBackgroundColor = BIN_LOSING_BACKGROUND_COLOR;
	    noBinBackgroundColor = NO_BIN_WINNING_BACKGROUND_COLOR;
	  } else if (numYesVotes == numNoVotes) {
	    yesBinBackgroundColor = YES_BIN_WINNING_BACKGROUND_COLOR;
	    noBinBackgroundColor = NO_BIN_WINNING_BACKGROUND_COLOR;
	  }
	  if (bin == yesBin) {
	    return yesBinBackgroundColor;
	  } else if (bin == noBin) {
	    return noBinBackgroundColor;
	  }
	};
	
	self.determineBinWidth = function(bin) {
	  var vote;
	  if (bin == yesBin) {
	    vote = "yes"
	  } else if (bin == noBin) {
	    vote = "no";
	  }
    var numVotes = voteToSocketIdsMap[vote].length;
    var minVotes = 0;
    var maxVotes = voteToSocketIdsMap["yes"].length + voteToSocketIdsMap["no"].length;
    var normalizedNumVotes = 0;
    if (maxVotes > 0) {
      normalizedNumVotes = (numVotes - minVotes) / maxVotes;
    } else {
      return 0;
    }
    var maxWidth = .85 * voteBallPit.offsetWidth;
    var minWidth = 1.1 * self.determineVoteBallSize();
    if (minWidth > maxWidth) {
      minWidth = .9 * maxWidth;
    }
    var binWidth = (normalizedNumVotes * (maxWidth - minWidth)) + minWidth;
    return binWidth;
	};
	
	self.determineBinBorderColor = function(bin) {
	  var numYesVotes = voteToSocketIdsMap["yes"].length;
	  var numNoVotes = voteToSocketIdsMap["no"].length;
	  var yesBinBorderColor;
	  var noBinBorderColor;
	  if (numYesVotes > numNoVotes) {
      yesBinBorderColor = YES_BIN_WINNING_BORDER_COLOR;
      noBinBorderColor = BIN_LOSING_BORDER_COLOR;
	  } else if (numYesVotes < numNoVotes) {
	    yesBinBorderColor = BIN_LOSING_BORDER_COLOR;
	    noBinBorderColor = NO_BIN_WINNING_BORDER_COLOR;
	  } else if (numYesVotes == numNoVotes) {
	    yesBinBorderColor = YES_BIN_WINNING_BORDER_COLOR;
	    noBinBorderColor = NO_BIN_WINNING_BORDER_COLOR;
	  }
	  if (bin == yesBin) {
	    return yesBinBorderColor;
	  } else if (bin == noBin) {
	    return noBinBorderColor;
	  }
	};

	self.updateVoteBalls = function() {
	  var voteBalls = self.getVoteBalls();
    for (var i=0; i<voteBalls.length; i++) {
      var voteBall = voteBalls[i];
      if (voteBall.getAmTouched() == false) {
        var vote = voteBall.getVote();
        if (vote == "yes") {
          if (self.checkIfVoteBallIsInBin(voteBall, yesBin) == false) {
            self.moveVoteBallToBin(voteBall, yesBin);
          }
        } else if (vote == "no") {
          if (self.checkIfVoteBallIsInBin(voteBall, noBin) == false) {
            self.moveVoteBallToBin(voteBall, noBin);
          }   
        } else if (vote == "undecided") {
          if (self.checkIfVoteBallIsInBin(voteBall, undecidedBin) == false) {
            self.moveVoteBallToBin(voteBall, undecidedBin);
          }
        }
      }
    }
	};

	self.checkIfVoteBallIsInBin = function(voteBall, bin) {
	  var minX;
	  var maxX;
	  var minY;
	  var maxY;
	  var voteBallX = voteBall.getElement()._gsTransform.x;
	  var voteBallY = voteBall.getElement()._gsTransform.y;
	  
	  if ((bin == yesBin) || (bin == noBin)) {
  	  var newSize = self.determineVoteBallSize();
  	  var binX = bin._gsTransform.x;
  	  var binY = bin._gsTransform.y;
  	  minX = binX - bin.offsetWidth/2 + newSize/2;
	    maxX = binX + bin.offsetWidth/2 - newSize/2;
	    minY = binY - bin.offsetHeight/2 + newSize/2;
	    maxY = binY + bin.offsetHeight/2 - newSize/2;
	    if ( (voteBallX >= minX) && (voteBallX <= maxX) && (voteBallY >= minY) && (voteBallY <= maxY) ) {
	      return true;
	    }
	  } else if (bin == undecidedBin) {
	    var jitter = voteBall.getJitter(voteBall.getVote());
	    minX = 0 - jitter["maxX"];
	    maxX = voteBallPit.offsetWidth + jitter["maxX"];
	    minY = undecidedBin._gsTransform.y - jitter["maxY"];
	    maxY = undecidedBin._gsTransform.y + jitter["maxY"];
	    if ((voteBallX >= minX) && (voteBallX <= maxX) && (voteBallY >= minY) && (voteBallY <= maxY)) {
	      return true
	    }
	  }
	  
	  return false;
	}
	
	self.moveVoteBallToBin = function(voteBall, bin) {
	  var binX = bin._gsTransform.x;
	  var binY = bin._gsTransform.y;
	  var minX;
	  var maxX;
	  var minY;
	  var maxY;
	  var vote = voteBall.getVote();
	  var style = voteBall.getStyle(vote);
	  var newX;
	  var newY;
	  var newSize;
    var newBackgroundColor = style["backgroundColor"];
    var newBorderRadius = style["borderRadius"];
    var newOpacity = style["opacity"];
    var ease = Elastic.easeOut;
    var duration = 2;

	  if (vote == "undecided") {
      minX = 0;
      maxX = voteBallPit.offsetWidth;
      minY = undecidedBin._gsTransform.y;
      maxY = undecidedBin._gsTransform.y;
      newX = (Math.random() * (maxX - minX)) + minX;
      newY = (Math.random() * (maxY - minY)) + minY;
      newSize = style["size"];
      ease = Back.easeOut;
	  } else {
	    newSize = self.determineVoteBallSize();
	    minX = binX - bin.offsetWidth/2 + newSize/2;
	    maxX = binX + bin.offsetWidth/2 - newSize/2;
	    minY = binY - bin.offsetHeight/2 + newSize/2;
	    maxY = binY + bin.offsetHeight/2 - newSize/2;
	    newX = (Math.random() * (maxX - minX)) + minX;
	    newY = (Math.random() * (maxY - minY)) + minY;
	  }
	  
	  voteBall.setPosition(newX, newY);
	  
	  
	  TweenLite.to(voteBall.getElement(), 2, {
      x: newX,
      y: newY,
      width: newSize,
      height: newSize,
      backgroundColor: newBackgroundColor,
      borderWidth: 0,
      opacity: newOpacity,
      xPercent: -50,
      yPercent: -50,
      ease: ease,
      onComplete: voteBall.jitter
	  });
	};
  
  self.createVoteBall = function(socketId) {
    var voteBall = new VoteBall(brain, socketId);
	  voteBall.setVote("undecided");
	  socketIdToVoteBallMap[socketId] = voteBall;
	  self.updateVoteCount(voteBall);
	  voteBallPit.appendChild(voteBall.getElement());
	  return voteBall;
	};
	
  self.addVoteBallToBallPit = function(voteBall) {
    voteBall.setVote("undecided");
    var startX = voteBallPit.offsetWidth;
    var startY = voteBallPit.offsetHeight/2;
    var startOpacity = 0;
    TweenLite.set(voteBall.getElement(), {
      x: startX,
      y: startY,
      opacity: startOpacity,
      onComplete: function() {
        self.moveVoteBallToBin(voteBall, undecidedBin);
      }
    });
  };
  
  self.deleteVoteBall = function(voteBall) {
    // Fade out the voteBall
    TweenLite.to(voteBall.getElement(), 1, {
      opacity: 0,
      onComplete: function() {
        // Remove it from the dom
        voteBallPit.removeChild(voteBall.getElement());
        
        // Remove it from socketIdToVoteBallMap
        var socketId = voteBall.getSocketId();
        var vote = voteBall.getVote();
        delete socketIdToVoteBallMap[socketId];
        
        // Remove it from voteToSocketIdsMap
        var indexOfSocketId = voteToSocketIdsMap[vote].indexOf(socketId);
        if (indexOfSocketId > -1) {
          voteToSocketIdsMap[vote].splice(indexOfSocketId, 1);
        }
        
      }
    });
  };
  
  self.determineVoteBallSize = function() {
    // Make the vote balls pack into the area of the vote ball pit
    // Then scale down a little to compensate for overlapping
    var numVoteBalls = self.getVoteBalls().length;
    if (numVoteBalls == 0) {
      return 0;
    }
    var voteBallPitArea = voteBallPit.offsetWidth * voteBallPit.offsetHeight;
    var ballArea = voteBallPitArea / numVoteBalls;
    var scalar = .5;
    var size = Math.pow(ballArea, .5) * scalar;
    return size;
  };
  
  self.reset = function() {
    console.log("reset voteBallPit");
    // Delete all the voteBalls
    var voteBalls = self.getVoteBalls();
    for (var i=(voteBalls.length-1); i>=0; i--) {
      var voteBall = voteBalls[i];
      self.deleteVoteBall(voteBall);
    }
    
    // Reset the data structures
	  socketIdToVoteBallMap = {};
    voteToSocketIdsMap = {"yes":[], "undecided": [], "no": []};
    
    // Reset the bins
    self.updateBin(yesBin, "yes");
	  self.updateBin(noBin, "no");
	  
	  // Reset the history plot
	  voteHistoryPlot.reset();
  };
  
  self.refresh = function() {
    console.log("refresh voteBallBit");
    
    // Move all the vote balls to undecided
    var voteBalls = self.getVoteBalls();
    for (var i=(voteBalls.length-1); i>=0; i--) {
      var voteBall = voteBalls[i];
      voteBall.setVote("undecided");
      self.updateVoteCount(voteBall);
      self.moveVoteBallToBin(voteBall, undecidedBin);
    }
    
    // Reset the bins
    self.updateBin(yesBin, "yes");
	  self.updateBin(noBin, "no");
	  
	  // Reset the history plot
	  voteHistoryPlot.reset();
  }
  
  self.updateVoteCount = function(voteBall) {
    var vote = voteBall.getVote();
    var socketId = voteBall.getSocketId();
    
	  var yesSocketIds = voteToSocketIdsMap["yes"];
	  var undecidedSocketIds = voteToSocketIdsMap["undecided"];
	  var noSocketIds = voteToSocketIdsMap["no"];
	  
	  var yesIndex = yesSocketIds.indexOf(socketId);
	  var undecidedIndex = undecidedSocketIds.indexOf(socketId);
	  var noIndex = noSocketIds.indexOf(socketId);
	  
	  var isInYes = (yesIndex > -1);
	  var isInUndecided = (undecidedIndex > -1);
	  var isInNo = (noIndex > -1);
	  
	  if (vote == "yes") {
      if (isInYes == false) {
        yesSocketIds.push(socketId);
        if (isInUndecided) {
          undecidedSocketIds.splice(undecidedIndex, 1);
        }
        if (isInNo) {
          noSocketIds.splice(noIndex, 1);
        }
      } 
	  } else if (vote == "undecided") {
      if (isInUndecided == false) {
        undecidedSocketIds.push(socketId);
        if (isInYes) {
          yesSocketIds.splice(yesIndex, 1);
        }
        if (isInNo) {
          noSocketIds.splice(noIndex, 1);
        }
      } 
	  } else if (vote == "no") {
      if (isInNo == false) {
        noSocketIds.push(socketId);
        if (isInYes) {
          yesSocketIds.splice(yesIndex, 1);
        }
        if (isInUndecided) {
          undecidedSocketIds.splice(undecidedIndex, 1);
        }
      } 
	  }
	  
	  /*
	  document.querySelector("#noVotes").textContent = noSocketIds.length.toString();
	  document.querySelector("#undecidedVotes").textContent = undecidedSocketIds.length.toString();
	  document.querySelector("#yesVotes").textContent = yesSocketIds.length.toString();
	  */
	}
  
  self.moveVoteBallToTouchPosition = function(voteBall, vote, normalizedX, normalizedY) {
	  var style = voteBall.getStyle(vote);
	  var newSize = self.determineVoteBallSize();
    var newX = (normalizedX * voteBallPit.offsetWidth);
    var newY = (normalizedY * voteBallPit.offsetHeight);
    var newBackgroundColor = style["backgroundColor"];
    var newOpacity = style["opacity"];
    var ease = Elastic.easeOut;
    var duration = 2;
	  TweenLite.to(voteBall.getElement(), 2, {
      x: newX,
      y: newY,
      xPercent: -50,
      yPercent: -50,
      width: newSize,
      height: newSize,
      backgroundColor: newBackgroundColor,
      opacity: newOpacity,
      ease: ease
	  });
  };
  
  self.pause = function() {
    self.showShade();
  };
  
  self.play = function() {
    self.hideShade();
  };
  
  self.showShade = function() {
    TweenLite.set(shade, {
      y: voteBallPit.offsetHeight,
      display: "block"
    });
    
    TweenLite.to(shade, 2, {
      y: 0,
      ease: Quint.easeOut
    });
  };
  
  self.hideShade = function() {
    TweenLite.to(shade, 2, {
      y: voteBallPit.offsetHeight,
      ease: Quint.easeOut,
      onComplete: function() {
        shade.style.display = "none";
      }
    });
  };
  
  
  self.init();
}



function VoteBall(brain, socketId) {
  
  var self = this;
  var image;
  var div;
  var vote;
  var voteDecayTimeoutId;
  var VOTE_DECAY_DURATION = 30000;
  var YES_BORDER_RADIUS = "50% 50% 50% 50%";
  var YES_BACKGROUND_COLOR = "rgb(100, 255, 218)";
  var YES_OPACITY = .75;
  var UNDECIDED_BORDER_RADIUS = "50% 50% 50% 50%";
  var UNDECIDED_SIZE = "16px";
  var UNDECIDED_BACKGROUND_COLOR = "rgb(204, 204, 204)";
  var UNDECIDED_OPACITY = .6;
  var NO_BORDER_RADIUS = "50% 50% 50% 50%";
  var NO_BACKGROUND_COLOR = "rgb(255, 64, 129)";
  var NO_OPACITY = .75
  var BORDER_COLOR = "rgba(33, 150, 243, 1)";
  var styles;
  var position;
  var amTouched = false;
  var jitters;
  
  self.init = function() {
    self.createStyles();
    self.createJitters();
    self.createDiv();
  };
  
  self.createStyles = function() {
    styles = {
      "yes": {
        "borderRadius": YES_BORDER_RADIUS,
        "size": null,
        "backgroundColor": YES_BACKGROUND_COLOR,
        "opacity": YES_OPACITY
      },
      "undecided": {
        "borderRadius": UNDECIDED_BORDER_RADIUS,
        "size": UNDECIDED_SIZE,
        "backgroundColor": UNDECIDED_BACKGROUND_COLOR,
        "opacity": UNDECIDED_OPACITY
      },
      "no": {
        "borderRadius": NO_BORDER_RADIUS,
        "size": null,
        "backgroundColor": NO_BACKGROUND_COLOR,
        "opacity": NO_OPACITY
      },
    };
  };
  
  self.createJitters = function() {
    jitters = {
      "yes": {
        "maxX": 15,
        "maxY": 15
      },
      "no": {
        "maxX": 15,
        "maxY": 15
      },
      "undecided": {
        "maxX": 10,
        "maxY": 3
      }
    };
  };
  
  self.createDiv = function() {
    div = document.createElement("div");
    div.style.borderRadius = UNDECIDED_BORDER_RADIUS;
    div.style.backgroundColor = UNDECIDED_BACKGROUND_COLOR;
    div.style.borderStyle = "solid";
    div.style.borderWidth = 0;
    div.style.borderColor = BORDER_COLOR;
    div.style.width = UNDECIDED_SIZE;
    div.style.height = UNDECIDED_SIZE;
    div.style.position = "absolute";
    div.style.zIndex = 2;
  };
  
  self.getElement = function() { return div; };
  self.getSocketId = function() { return socketId; };
  self.getVote = function() { return vote; };
  self.setVote = function(newVote) {
    vote = newVote;
    if (newVote != "undecided") {
      self.resetVoteDecayTimeout();
    }
  };
  self.getStyle = function(style) { return styles[style]; };
  self.setPosition = function(newX, newY) {
    position = {
      "x": newX,
      "y": newY
    };
  };
  self.getAmTouched = function() { return amTouched; };
  self.setAmTouched = function(newAmTouched) { amTouched = newAmTouched; };
  self.getJitter = function(vote) { return jitters[vote]; }

  
  self.resetVoteDecayTimeout = function() {
    clearTimeout(voteDecayTimeoutId);
    voteDecayTimeoutId = setTimeout(self.onVoteDecayTimeoutElapsed, VOTE_DECAY_DURATION);
  };
  
  self.onVoteDecayTimeoutElapsed = function() {
    brain.getVoteManager().getVoteRoomScreen().getVoteBallPit().onVoteBallVoteDecayed(self);
  };
  
  self.jitter = function() {
    var maxXJitter = self.getJitter(self.getVote())["maxX"];
    var maxYJitter = self.getJitter(self.getVote())["maxY"];
    var newX = Math.random() * 2 * maxXJitter - maxXJitter + position["x"];
    var newY = Math.random() * 2 * maxYJitter - maxYJitter + position["y"];
    var duration = 2;
    TweenLite.to(div, duration, {
      x: newX,
      y: newY,
      ease: Linear.easeOut,
      onComplete: function() {
        self.jitter();
      }
    });
  }
  
  self.enableHighlight = function() {
    TweenLite.to(div, .6, {
      borderWidth: 5,
      ease: Quint.easeOut
    });
  };
  
  self.disableHighlight = function() {
    TweenLite.to(div, .6, {
      borderWidth: 0,
      ease: Quint.easeOut
    });
  };

  
  self.init();
}
