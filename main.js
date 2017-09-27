/*
main.js

Main entry point for the server app
Creates the singletons that manage voting room logic
and socket communiation with the admin client and mobile clients
*/


// Top level manager
function Brain() {

	var self = this;
	var voteManager;
	var serverManager;

	self.init = function() {
		voteManager = new VoteManager(self);
		serverManager = new ServerManager(self);
	};


	///////////////////////////////////
	// accessors
	///////////////////////////////////

	self.getVoteManager = function() { return voteManager; };
	self.getServerManager = function() { return serverManager; };


	self.init();
}


// Manages socket communication with
// the admin client and mobile clients
function ServerManager(brain) {

	var self = this;
	var app;
	var express;
	var cheerio;
	var fs;
	var path;

	var favicon;
	var PUBLIC_FOLDER_PATH = "/public";
	var MOBILE_CLIENT_FOLDER_PATH = PUBLIC_FOLDER_PATH + "/mobileClient";
	var MOBILE_CLIENT_INDEX_PATH = MOBILE_CLIENT_FOLDER_PATH + "/index.html";
	var FAVICON_PATH = MOBILE_CLIENT_FOLDER_PATH + "/images/favicon.png";
	var MOBILE_CLIENT_SOCKET_PORT = 54322;
	var ADMIN_CLIENT_SOCKET_PORT = 54321;
	var mobileClientSockets = [];
	var adminClientSockets = [];
//	var MOBILE_CLIENT_BASE_URL = "https://pwdemo.org/" + MOBILE_CLIENT_SOCKET_PORT + "/";
	var MOBILE_CLIENT_BASE_URL = "http://localhost:" + MOBILE_CLIENT_SOCKET_PORT + "/";


	self.init = function() {
		express = require('express');
		cheerio = require('cheerio');
		fs = require('fs');
		path = require('path');

		self.createApp();
		self.createFavicon();
		self.createAdminClientSocketListener();
		self.createMobileClientSocketListener();
	};

	// Create the express app and specify
	// how incoming http requests are routed
	self.createApp = function() {
		app = express();

		// Serve up static files from the public folder
		app.use(express.static(__dirname + PUBLIC_FOLDER_PATH));

		const bodyParser = require('body-parser')

		app.set('view engine', 'ejs')
		app.use(bodyParser.urlencoded({extended: true}))
		app.use(bodyParser.json())
		app.use(express.static('public'))

		//app.get('/', (req, res) => {
		//  res.render('index.ejs', {});
		//})
	};

	// Serve up the favicon
	self.createFavicon = function() {
		var favicon = require('serve-favicon');
		app.use(favicon(__dirname + FAVICON_PATH));
	};

	// Listen for incoming admin client sockets
	self.createAdminClientSocketListener = function() {
		var server = self.createHttpsServer();
		var io = require("socket.io")(server);

		// Listen for the connection event
		io.on("connection", function(socket){
			// Specify the message handlers
			self.handleAdminClientSocketConnection(socket);
			socket.on("disconnect", function() {
				self.handleAdminClientSocketDisconnection(socket);
	   		});
	   		socket.on("voteRoom", function(message) {
	   			self.handleVoteRoomMessage(socket, message);
	   		});
	   		socket.on("createFakeMobileClient", self.handleCreateFakeMobileClientMessage);
	   		socket.on("deleteFakeMobileClient", self.handleDeleteFakeMobileClientMessage);
	   		socket.on("simulateVote", self.handleSimulateVoteMessage);
		});

		// Listen for sockets on the given port
		server.listen(ADMIN_CLIENT_SOCKET_PORT, function() {
		  console.log("listening on *:" + ADMIN_CLIENT_SOCKET_PORT.toString());
		});
	};

	// Listen for incoming mobile client sockets
	self.createMobileClientSocketListener = function() {
		var server = self.createHttpsServer();
		var io = require('socket.io')(server);

		// Listen for the connection event
		io.on("connection", function(socket){
			// Specify the message handlers
			self.handleMobileClientSocketConnection(socket);
			socket.on("disconnect", function() {self.handleMobileClientSocketDisconnection(socket);});
			socket.on("vote", function(message) {self.handleVoteMessage(socket, message);});
		});

		// Listen for sockets on the given port
		server.listen(MOBILE_CLIENT_SOCKET_PORT, function() {
		  console.log('listening on *:' + MOBILE_CLIENT_SOCKET_PORT.toString());
		});
	};

	// Create the https server that will serve the clients
	self.createHttpsServer = function() {
		//var https = require("https");
		
/*		var key_file = "pwdemo.org.key";
		var cert_file = "pwdemo.org.crt";
		var ca_file = "gd_bundle-g2-g1.crt";

	 	var config = {
			key: fs.readFileSync(key_file),
		 	cert: fs.readFileSync(cert_file),
		 	ca: fs.readFileSync(ca_file)
		};

		var server = https.createServer(config, app);*/

		var server = require('http').createServer(app)
		return server;
	};


	///////////////////////////////////
	// utilities
	///////////////////////////////////

	// Do something given the admin client socket connection
	self.handleAdminClientSocketConnection = function(socket) {
		console.log("admin client socket", socket.id, "connection opened");
		// Store the socket in a list
		adminClientSockets.push(socket);
	};

	// Do something given the admin client socket disconnection
	self.handleAdminClientSocketDisconnection = function(socket) {
		console.log("admin client socket", socket.id, "disconnected");
		
		// Remove the socket from the adminClientSockets array
		var socketIndex = adminClientSockets.indexOf(socket);
		if (socketIndex > -1) {
			adminClientSockets.splice(socketIndex, 1);
		}
		
		// Delete the vote room for this admin socket
		brain.getVoteManager().deleteVoteRoomForGivenAdminSocket(socket);
	};
	
	//Do something given the mobile client socket connection
	self.handleMobileClientSocketConnection = function(socket) {
		console.log("mobile client socket", socket.id, "connection opened");
		// Store the socket in a list
		mobileClientSockets.push(socket);
		
		// Extract the vote room from the referrer url
		var referer = socket.request.headers.referer;
		var voteUrlParts = referer.split("/");
		var voteRoomIndex = voteUrlParts[voteUrlParts.length - 1];
		var voteRoom = voteRoomIndex.split(".")[0].replace("index_", "");
		
		// Add this mobile client to the given vote room
		brain.getVoteManager().addMobileClientToVoteRoom(voteRoom, socket);
	};

	// Do something given the mobile client socket disconnection
	self.handleMobileClientSocketDisconnection = function(socket) {
		console.log("mobile client socket " + socket.id + " disconnected");
		// Remove the socket from  the stored list
		self.deleteMobileClientSocket(socket);
	};

	// Receive a vote room message from the admin client
	self.handleVoteRoomMessage = function(adminSocket, message) {
		// Create the vote room url route path
		var voteRoom = message["voteRoom"];

		// Prepare the index file for this vote room
		self.initIndexFileForGivenVoteRoom(voteRoom);

		// Build the vote url
		var voteUrl = MOBILE_CLIENT_BASE_URL + voteRoom;
		
		// Ask vote manager to create the vote room
		brain.getVoteManager().createVoteRoom(adminSocket, voteRoom, voteUrl);
	};

	// Build the index file for the given vote room
	// We specify the title and description
	// so that the URL discoverers can disambiguate the various open rooms
	self.initIndexFileForGivenVoteRoom = function(voteRoom) {
		var newTitle = 'Welcome to Vote Room ' + voteRoom + '!';
		var newDescription = 'Please submit yes or no as often as you like. You may be graded on poise, efficiency, and correctness.';
		var baseIndexFileAbsolutePath = path.join(__dirname, MOBILE_CLIENT_INDEX_PATH);
		var newIndexFileAbsolutePath = baseIndexFileAbsolutePath.split('.')[0] + '_' + voteRoom + '.html';
		var newIndexFileRelativePath = MOBILE_CLIENT_FOLDER_PATH + '/index_' + voteRoom + '.html';

		// Load the base index file
		fs.readFile(baseIndexFileAbsolutePath, 'utf8', function (err, html) {
			// Load the dom
			var $ = cheerio.load(html);

			// Edit the title
			$('title').text(newTitle);

			// Edit the description
			var metas = $('meta');
			for (var i=0; i<metas.length; i++) {
				var meta = metas[i];
				if (meta['attribs']['name'] == 'description') {
					meta['attribs']['content'] = newDescription;
					break;
				}
			}

			// Save the new index file
			var newHtml = $.html();
			fs.writeFile(newIndexFileAbsolutePath, newHtml, function (err) {
				if (err) throw err;
				console.log('vote room', voteRoom, 'index file created');
			});

			// Route to the new index file
			app.get('/' + voteRoom, function(req, res) {
				res.sendFile(newIndexFileRelativePath, {"root": __dirname});
			});
		});
	};

	// Receive a create fake mobile client message from the admin client
	self.handleCreateFakeMobileClientMessage = function(message) {
		// Extract the vote room
		var voteRoom = message["voteRoom"];
		// Create a fake mobile client for that room
		self.createFakeMobileClient(voteRoom);
	};

	// Receive a delete fake mobile client message from the admin client
	self.handleDeleteFakeMobileClientMessage = function(message) {
		// Extract the vote room and socket id
		var voteRoom = message["voteRoom"];
		var socketId = message["socketId"];
		// Remove the fake mobile client from that vote room
		self.deleteFakeMobileClient(voteRoom, socketId);
	};

	// Receive a simulate vote message from the admin client
	self.handleSimulateVoteMessage = function(message) {
		// Extract the vote room, socket id, and simulated vote
		var voteRoom = message["voteRoom"];
		var socketId = message["socketId"];
		var vote = message["vote"];
		// Find the mobile client socket with the given id
		var mobileClientSocket = self.findMobileClientSocketWithGivenId(socketId);
		// If the socket exists
		if (mobileClientSocket != null) {
			// Tell the vote manager about the simulated vote
			brain.getVoteManager().onSimulatedVoteReceived(voteRoom, mobileClientSocket, vote);
		}
	}

	// Receive a vote message from a mobile client with the given socket
	self.handleVoteMessage = function(socket, message) {
		// Tell the vote manager about it
		brain.getVoteManager().onVoteMessageReceived(socket, message);
	}

	// Create a fake mobile client for the given vote room
	// We do this so the admin client can simulate multiple users and voting
	// even if there are no actual mobile clients running
	self.createFakeMobileClient = function(voteRoom) {
		var fakeSocket = {"id": parseInt(Math.random() * 1000000000).toString()};
		mobileClientSockets.push(fakeSocket);
		brain.getVoteManager().addMobileClientToVoteRoom(voteRoom, fakeSocket);
	};

	// Remove a fake mobile client with the given socket id from the given vote room
	self.deleteFakeMobileClient = function(voteRoom, socketId) {
		// Find the mobile client socket with the given id
		var socket = self.findMobileClientSocketWithGivenId(socketId);
		// Remove the given socket
		self.deleteMobileClientSocket(socket);
	};

	// Remove the given mobile client socket from that stored
	self.deleteMobileClientSocket = function(socket) {
		// Remove the socket from the mobileClientSockets array
		var socketIndex = mobileClientSockets.indexOf(socket);
		if (socketIndex > -1) {
			mobileClientSockets.splice(socketIndex, 1);
		}

		// Remove the mobile client from it's vote room
		brain.getVoteManager().deleteMobileClient(socket);
	};

	// Find the mobile client socket that has the given socket it
	self.findMobileClientSocketWithGivenId = function(socketIdToFind) {
		for (var i=0; i<mobileClientSockets.length; i++) {
			var mobileClientSocket = mobileClientSockets[i];
			var socketId = mobileClientSocket.id;
			if (socketId == socketIdToFind) {
				return mobileClientSocket;
			}
		}
		return null;
	}


	self.init();
}







function VoteManager(brain) {

	var self = this;
	var voteRoomToAdminClientSocketMap = {};
	var voteRoomToMobileClientSocketsMap = {};

	self.init = function() {

	};


	///////////////////////////////////
	// accessors
	///////////////////////////////////

	self.getVoteRooms = function() {
		var voteRooms = Object.keys(voteRoomToAdminClientSocketMap);
		return voteRooms;
	}


	///////////////////////////////////
	// callbacks
	///////////////////////////////////

	self.onSimulatedVoteReceived = function(voteRoom, mobileClientSocket, vote) {
		var simulatedMessage = {
			"v": vote,
		};
		self.onVoteMessageReceived(mobileClientSocket, simulatedMessage);
	};

	self.onVoteMessageReceived = function(mobileClientSocket, message) {
		var voteRoom = self.findVoteRoomForGivenMobileClientSocket(mobileClientSocket);
		if (voteRoom == null) {
			return;
		}
		var adminSocket = self.findAdminSocketForGivenVoteRoom(voteRoom);
		if (adminSocket == null) {
			return;
		}
		message["socketId"] = mobileClientSocket.id;
		adminSocket.emit("vote", message);
	};


	///////////////////////////////////
	// utilities
	///////////////////////////////////

	self.deleteVoteRoomForGivenAdminSocket = function(socket) {	
		var voteRooms = self.getVoteRooms();
		for (var i=0; i<voteRooms.length; i++) {
			var voteRoom = voteRooms[i];
			var adminSocket = voteRoomToAdminClientSocketMap[voteRoom];
			if (adminSocket.id == socket.id) {
				console.log("deleting voteRoom", voteRoom, "for adminSocket", adminSocket.id);
				delete voteRoomToAdminClientSocketMap[voteRoom];
				delete voteRoomToMobileClientSocketsMap[voteRoom];
			}
		}
	};

	self.createVoteRoom = function(adminSocket, voteRoom, voteUrl) {
		console.log("creating voteRoom", voteRoom, "for adminSocket", adminSocket.id);
		self.deleteVoteRoomForGivenAdminSocket(adminSocket);
		voteRoomToAdminClientSocketMap[voteRoom] = adminSocket;
		voteRoomToMobileClientSocketsMap[voteRoom] = [];
		adminSocket.emit("voteUrlCreated", {"voteUrl": voteUrl});
	}

	self.addMobileClientToVoteRoom = function(voteRoom, socket) {
		var voteRooms = self.getVoteRooms();
		if (voteRooms.indexOf(voteRoom) > -1) {
			console.log("adding mobileClientSocket", socket.id, "to voteRoom", voteRoom);
			voteRoomToMobileClientSocketsMap[voteRoom].push(socket);
			
			// Tell the adminSocket about this socket's connection
			var adminSocket = self.findAdminSocketForGivenVoteRoom(voteRoom);
			var message = {"socketId": socket.id};
			adminSocket.emit("mobileClientSocketConnect", message);
		} else {
			console.log("no voteRoom found for: ", voteRoom);
		}
	}

	self.findAdminSocketForGivenVoteRoom = function(voteRoom) {
		var voteRooms = self.getVoteRooms();
		if (voteRooms.indexOf(voteRoom) != -1) {
			var adminSocket = voteRoomToAdminClientSocketMap[voteRoom];
			return adminSocket;
		}
		return null;
	}

	self.deleteMobileClient = function(socket) {
		// Remove the mobile client socket from it's voteRoom
		var voteRooms = self.getVoteRooms();
		for (var i=0; i<voteRooms.length; i++) {
			var voteRoom = voteRooms[i];
			var sockets = voteRoomToMobileClientSocketsMap[voteRoom];
			for (var j=sockets.length-1; j>=0; j--) {
				if (sockets[j].id == socket.id) {
					console.log("deleting mobileClientSocket", socket.id, "from  voteRoom", voteRoom);
					sockets.splice(j, 1);
					
					// Tell the adminSocket about this socket's disconnection
					var adminSocket = self.findAdminSocketForGivenVoteRoom(voteRoom);
					var message = {"socketId": socket.id};
					adminSocket.emit("mobileClientSocketDisconnect", message);
				}
			}
		}
	}

	self.findVoteRoomForGivenMobileClientSocket = function(mobileClientSocket) {
		var voteRooms = self.getVoteRooms();
		for (var i=0; i<voteRooms.length; i++) {
			var voteRoom = voteRooms[i];
			var sockets = voteRoomToMobileClientSocketsMap[voteRoom];
			for (var j=0; j<sockets.length; j++) {
				var socket = sockets[j];
				if (socket.id == mobileClientSocket.id) {
					return voteRoom;
				}
			}
		}
		return null;
	};


	self.init();
}


var brain = new Brain();


