io.on('connect', function(socket){
  var player = Player(socket.id);
  SOCKET_LIST[socket.id] = socket;
  PLAYER_LIST[socket.id] = player;


  socket.on('selectedcard', function(data){
    console.log(socket.id); //this is undefined
  });

});
