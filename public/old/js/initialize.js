// # App Initialization

// ##### [Back to Table of Contents](./tableofcontents.html)



// Initialize the app.

$(function() {
  // Set up all app properties listed in [app.js](../docs/app.html).
  App.init();

  // Set up video to be draggable.
  // $('#localVideo').draggable();
  // $('#remoteVideos').draggable();

  // **Mouse Events**

  // On mousedown detection, initialize drawing properties based on mouse coordinates. 
  App.canvas.on('mousedown', function(e) {

    // Allow user drawing only if other users are not drawing.
    if (!App.isAnotherUserActive) {
      console.log("User has started to draw.");

      // Initialize mouse position.
      App.mouse.click = true;
      App.mouse.x = e.offsetX;
      App.mouse.y = e.offsetY;

      // ```App.initializeMouseDown``` is from [app.js](../docs/app.html) where it initializes the pen and canvas before rendeirng.
      App.initializeMouseDown(App.pen, App.mouse.x, App.mouse.y);

      // Emit the pen object through socket. 
      App.socket.emit('start', App.pen);

      // Add the first mouse coordinates to the ```stroke``` array for storage.
      App.stroke.push([App.mouse.x, App.mouse.Y]);
    } else {
      console.log('Another user is drawing - please wait.');
    }
  });


  // On mousedrag detection, start to render drawing elements based on user's cursor coordinates.
  App.canvas.on('drag', function(e) {
    // Allow user drawing only if other users are not drawing.
    if (!App.isAnotherUserActive) {
      if (App.mouse.click) {
        App.mouse.drag = true;

        // Find x,y coordinates of the mouse dragging on the anvas.
        var x = e.offsetX;
        var y = e.offsetY;

        // Render the drawing.
        App.draw(x, y);
        console.log("Currently drawing coordinates", [x, y]);

        // Continue to push coordinates to stroke array (as part of storage).
        App.stroke.push([x, y]);

        // Emit x, y in a tuple through socket. 
        App.socket.emit('drag', [x, y]);
      }
    } else {
      console.log('Another user is drawing - please wait.');
    }
  });

  // On mouse dragend detection, tell socket that we have finished drawing. 
  App.canvas.on('dragend', function(e) {
    if (!App.isAnotherUserActive) {
      App.mouse.drag = false;
      App.mouse.click = false;

      console.log("Drawing is finished and its data is being pushed to the server", [App.stroke, App.pen]);

      // Empty the App.stroke array.
      App.stroke = [];

      // Tell socket that we've finished sending data.
      App.socket.emit('end', null);

    } else {
      console.log('Another user is drawing - please wait.');
    }
  });

  // If the cursor leaves the canvas whiteboard, simply stop drawing any more elements (by triggering a 'dragend' event).
  App.canvas.on('mouseleave', function(e) {
    App.canvas.trigger('dragend');
  });

  //RADIO STUFFS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  App.music.addEventListener('play', function(e) {
    console.log('im playing so funky ass shit');
    App.webrtc.sendToAll('wut?', App.getMusicStatus());
    // App.socket.emit('music_play', App.getMusicStatus());
  });

  App.music.addEventListener('pause', function(e) {
    console.log('hold up hold up, let me tie my shoe');
    App.webrtc.sendToAll('wut?', App.getMusicStatus());
    // App.socket.emit('music_pause', App.getMusicStatus());
  });

  //when the client starts up a room, make a call to get the status from anyone in the room
  // App.socket.emit('music_request_status',null);

  // $('.playMusic').on('click', function() {
  //   App.socket.emit('music_play_all', App.getMusicStatus());
  // });

  // $('.rtcChat').on('click', function() {
  //   App.webrtc.sendToAll('wtf', App.getMusicStatus());
  // });

  // App.socket.on('you_are_the_master', function(data) {
  //   setInterval(App.updateTheKids, 1000);
  // });


});
