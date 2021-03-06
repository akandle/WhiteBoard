// # App Setup

// ##### [Back to Table of Contents](./tableofcontents.html)


// Set up app properties.

var App = {};

App.init = function() {
  // Connect to sockets.io with unique ioRoom ID - either a new whiteboard or used and saved previously by [sockets.js](../docs/sockets.html)
  var ioRoom = window.location.href;
  App.socket = io(ioRoom);


  //**Video Chat Functionality** 

  //Create a video chat Object.
  App.webrtc = new SimpleWebRTC({
    // **localVideoEl**: the ID/element DOM element that will hold the current user's video
    // localVideoEl: 'localVideo',
    // // **remoteVideosEl**: the ID/element DOM element that will hold remote videos
    // remoteVideosEl: 'remoteVideos',
    // // **autoRequestMedia**: immediately ask for camera access
    // autoRequestMedia: true

    // we don't do video
    localVideoEl: '',
    remoteVideosEl: '',
    // dont ask for camera access
    autoRequestMedia: false,
    // dont negotiate media
    receiveMedia: {
        mandatory: {
            OfferToReceiveAudio: false,
            OfferToReceiveVideo: false
        }
    },

    url: '104.131.154.76:8888'
  });

  // The room name is the same as our socket connection.
  // App.webrtc.on('readyToCall', function() {
  //   console.log('ready to join room');
    App.webrtc.joinRoom(ioRoom);
  // });

  App.webrtc.on('joinedRoom', function () {
    var peers = App.webrtc.getPeers();
    console.log(peers);
    if(peers.length === 0) {
      setInterval(App.updateTheKids, 5000);
    }
  });

  // console.log('i have peers! ',webrtc.peers);

  // **Whiteboard**

  // Set properties of the whiteboard.
  App.canvas = $('#whiteboard');
  App.canvas[0].width = window.innerWidth;
  App.canvas[0].height = window.innerHeight * 0.7;
  App.context = App.canvas[0].getContext("2d");

  // Set properties of the mouse click.
  App.mouse = {
    click: false,
    drag: false,
    x: 0,
    y: 0
  };

  // Initialize pen properties.
  // To add more new drawing features, i.e. different colours, thickness, add them to the ```App.pen``` object.
  App.pen = {
    fillStyle: 'solid',
    strokeStyle: "black",
    lineWidth: 5,
    lineCap: 'round'
  };

  // ```App.isAnotherUserActive``` is a Boolean that signals whether another user is currently drawing. The current implementation is such that only 1 user can draw at a time, i.e. simultaneous drawing is forbidden. To get rid of this functionality, remove  ```App.isAnotherUserActive``` and conditional loops that require it. 
  App.isAnotherUserActive = false;

  // ```App.stroke``` is an array of [x,y] coordinates for one drawing element. They are stored here, emitted ([in initialize.js](../docs/initialize.html)), and sent to [sockets.js](../docs/sockets.html). Once sent, ```App.stroke``` is emptied. 
  App.stroke = [];

  // ```App.prevPixel``` contains only 1 [x,y] coordinate pair - the coordinates of the previous pixel drawn. This is used in ```App.socket.on('drag'...``` for smooth rendering of drawn elements by other users. 
  App.prevPixel = [];


  // **Methods**


  // Draw according to coordinates.
  App.draw = function(x, y) {
    App.context.lineTo(x, y);
    App.context.stroke();
  };

  // Initialize before drawing: copy pen properties to ```App.context```, beginPath and set the starting coordinates to ```moveToX``` and ```moveToY```.
  App.initializeMouseDown = function(pen, moveToX, moveToY) {

    // Copy over current pen properties (e.g. fillStyle).
    for (var key in pen) {
      App.context[key] = pen[key];
    }

    // Begin draw.
    App.context.beginPath();
    App.context.moveTo(moveToX, moveToY);
  };



  // **Socket events**

  // Draw the board upon join.
  App.socket.on('join', function(board) {
    console.log("Joining the board.");

    // Check for null board data.
    if (board) {
      for (var i = 0; i < board.strokes.length; i++) {
        // Check for null stroke data.
        if (board.strokes[i]) {
          // Set pen and draw path.
          var strokesArray = board.strokes[i].path;
          var penProperties = board.strokes[i].pen;
          App.initializeMouseDown(penProperties, strokesArray[0][0], strokesArray[0][1]);

          // Draw the path according to the strokesArray (array of coordinate tuples).
          for (var j = 0; j < strokesArray.length; j++) {
            App.draw(strokesArray[j][0], strokesArray[j][1]);
          }
          App.context.closePath();
        }
      }
    }
  });


  // If another user is drawing, App.socket will receive a 'drag' event. App listens for the drag event and renders the drawing element created by the other user. 
  // Note that App prevents the current user from drawing while the other user is still drawing. 
  App.socket.on('drag', function(data) {
    App.isAnotherUserActive = true;
    console.log("Receiving data from another user:", data);

    // ```App.prevPixel``` is an array of the previous coordinates sent, so drawing is smoothly rendered across different browsers. 
    // If the ```App.prevPixel``` array is empty (i.e., this is the first pixel of the drawn element), then prevPixel is set as the coordinates of the current mouseclick. 
    if (App.prevPixel.length === 0) {
      App.prevPixel = data.coords;
    }

    // Initialize beginning coordinates and drawing.
    App.initializeMouseDown(data.pen, App.prevPixel[0], App.prevPixel[1]);
    App.draw(data.coords[0], data.coords[1]);

    // Set the current coordinates as App.prevPixel, so the next pixel rendered will be smoothly drawn from these coordinate points to the next ones. 
    App.prevPixel = data.coords;

  });

  // When the user has mouseup (and finished drawing) then ```App.prevPixel``` will be emptied.
  App.socket.on('end', function() {
    App.prevPixel = [];
    App.context.closePath();
    App.isAnotherUserActive = false;
  });

  //RADIO STUFFS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


  App.music = $('audio')[0];

  // App.socket.on('music_play', function(data) {
    
  //   App.music.play();

  //   updatePlayerTime(data);
    
  // });

  // App.socket.on('music_pause', function(data) {
    
  //   App.music.pause();

  //   updatePlayerTime(data);

  // });

  App.socket.on('music_request_status', function(data) {

    App.updateTheKids();

  });

  App.musicInitialized = false;

  // App.socket.on('music_status', function(data) {
  App.webrtc.connection.on('message', function(data) {  
    
    if(data.payload && data.payload.type === 'music_status') {
      console.log(data);
      // if(!App.musicInitialized) {

        console.log('player status: ', data.payload.paused);
        if(!data.payload.paused) {
          App.music.play();
        } else if(data.payload.paused) {
          App.music.pause();
        }
        // App.musicInitialized = true;
      // }

      updatePlayerTime(data.payload);
    }

  });

  App.updateTheKids = function() {
    // console.log('I AM THE MASTER, HEAR ME ROAR! '+App.getMusicStatus())
    // console.log('peers: ',App.webrtc.getPeers());
    // App.socket.emit('tester_music', App.getMusicStatus());
    if(!App.music.paused) {
      App.webrtc.sendToAll('wut?', App.getMusicStatus());
    }
  }

  App.getMusicStatus = function() {
    return {
      type: 'music_status',
      currentTime: App.music.currentTime,
      paused: App.music.paused,
      msgTime: Date.now()
    };
  };

  var updatePlayerTime = function(data) {
    var socketDiff = Date.now() - data.msgTime;

    // console.log('socket transmition lag: '+socketDiff);

    // console.log(App.music.currentTime,data.currentTime,(data.currentTime + socketDiff/1000))

    App.music.currentTime = data.currentTime + socketDiff/2000;
  };

  // App.webrtc.connection.on('message', function(message) {
  //   console.log('webRTC data: ', message);
  // });

};
