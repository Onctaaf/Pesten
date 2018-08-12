//
//FORCETAKE(x)
//GOAGAIN()
//
//gamestapel bouwen
//endgame logica
//design
//
//


console.log("hello world");
var express = require('express');
if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}
var app = express();
var serv = require('http').Server(app);
var io = require('socket.io')(serv);
//var legstapel = []

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);
// var topstack = '10H';
var PLAYING_LIST = {};
var SOCKET_LIST = {};
var PLAYER_LIST = {};
var Player = function(id){
  var self= {
    x:250,
    y:250,
    id:id,
    number:"" + Math.floor(10* Math.random()),
    ready:0,
    hand:[],
    go:0
  }
  return self;
}
var GAME_LIST = {};
var Game = function(){
  var self= {
    pot: [],
    legstapel: [],
    topstapel: "EMPTY",
    currentturn: null
  }
  return self;
}

var io = require('socket.io') (serv, {});

//als er een nieuwe speler joint wordt deze functie aangeroepen.
io.on('connect', function(socket){
  var id = socket.id;
  var player = Player(socket.id);
  console.log("socket:   " , socket.id);
  // if(Object.keys(PLAYER_LIST).length == null){
  // PLAYER_LIST[1] = player;//HIER IS DE ID GEKOZEN>>>>>
  // }else{
  //   player.id = Object.keys(PLAYER_LIST).length + 1;//HIER IS DE ID GEKOZEN>>>>>
  // }
  SOCKET_LIST[socket.id] = socket;


  PLAYER_LIST[socket.id] = player;

  if(Object.keys(PLAYING_LIST).length == null){
  PLAYING_LIST[1] = id;//HIER IS DE ID GEKOZEN>>>>>
  }else{
    PLAYING_LIST[Object.keys(PLAYING_LIST).length + 1] = id;
    // player.id = Object.keys(PLAYER_LIST).length + 1;//HIER IS DE ID GEKOZEN>>>>>
  }
  console.log(PLAYING_LIST);

  var currentturn = PLAYING_LIST[1];

  schudkaarten();

  socket.on('disconnect', function(){
    //delete SOCKET_LIST[socket.id];
    //delete PLAYER_LIST[socket.id];
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('userdisconnect');
    }

      console.log(PLAYER_LIST);
  });

  socket.on('ready', function(data){
    player.ready = 1;
    if(AllPlayersReady() == true){
      var pile = schudkaarten();
      deelkaarten(pile);
      StartGame();

    }
  })
  socket.on('status', function(data){
    console.log('ready status = ' + player.ready);
  })

  socket.on('selectedcard', function(data){
    // if(localStorage.getItem("legstapel" != null)){
    //   var legstapel = localStorage.getItem("legstapel");
    // }
    // else{
    //   var legstapel = [];
    // }
    var legstapel = GAME_LIST[1].legstapel;
    //console.log(PLAYER_LIST[socket.id].hand[data.card]);
    console.log("SOCKET: ", );
    console.log("SOCKET: ", SOCKET_LIST[id].id);
    var infonext = dealnodeal(GAME_LIST[1].topstapel, PLAYER_LIST[id].hand[data.card]);
    if(infonext[2] == true){
      io.emit('Boerchoice');
    }
    if(infonext[0] == true && infonext[1] == true){
      io.emit('right');
      console.log("CURRENT TURN:   " + currentturn);
      currentturn = nextplayer(currentturn);
    }
    else if (infonext[0] == true && infonext[1] == false) {
      goAgain();
    }
    else{
      io.emit('wrong');
    }

    if(infonext[0] == true){
      legstapel.push(PLAYER_LIST[id].hand[data.card]);
      console.log(legstapel)
      GAME_LIST[1].topstapel = PLAYER_LIST[id].hand[data.card];
      GAME_LIST[1].legstapel = legstapel;
    };
    console.log("topstackchange     " + GAME_LIST[1].topstapel);
    //for(var i in SOCKET_LIST){
      var socket = SOCKET_LIST[i];
      io.emit("topstackchange", {
        topstapel: GAME_LIST[1].topstapel
      });
    //};
  });
});


setInterval(function(){
  var pack = [];
  for(var i in PLAYER_LIST){
    var player = PLAYER_LIST[i];
    player.x++;
    player.y++;
    pack.push({
        x:player.x,
        y:player.y,
        number:player.number,
        ready:player.ready
    })
  }

  for(var i in SOCKET_LIST){
      var socket = SOCKET_LIST[i];
  }

}, 100/25);

schudkaarten = function(){
   var pile = ["2H", "3H", "4H", "5H", "6H", "7H", "8H", "9H", "10H", "BH", "QH", "KH", "AH", "2D", "3D", "4D", "5D", "6D", "7D", "8D", "9D", "10D", "BD", "QD", "KD", "AF", "2S", "3S", "4S", "5S", "6S", "7S", "8S", "9S", "10S", "BS", "QS", "KS", "AS", "2C", "3C", "4C", "5C", "6C", "7C", "8C", "9C", "10C", "BC", "QC", "KC", "AC", "JOKER", "JOKER"]
   for (let i = pile.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pile[i], pile[j]] = [pile[j], pile[i]];
    }
    return pile;
}

dealnodeal = function(topstack, chosen){
  var next = true;
  var boer = false;
  var value = false;
  if(topstack == "EMPTY"){
    next = true;
    value = true;
  }
  else if (topstack == "JOKER") {
    forcetake(5);
    value=true;
    next=true;
  }
  //if(topstack != "JOKER"){
    var topsplit = topstack.split('');
    if(topsplit.length == 3){
      var topsplitfix = []
      var firstpart = topsplit[0] + "" + topsplit[1];
      var secondpart = topsplit[2];
      topsplitfix.push(firstpart);
      topsplitfix.push(secondpart);
      topsplit = topsplitfix;
    }
  //}
  //if(chosen != "JOKER"){
    var chosensplit = chosen.split('');
    if(topsplit.length == 3){
      var chosensplitfix = []
      var firstpart = chosensplit[0] + "" + chosensplit[1];
      var secondpart = chosensplit[2];
      chosensplitfix.push(firstpart);
      chosensplitfix.push(secondpart);
      chosensplit = chosensplitfix;
    }
  //}

  if (chosen == "JOKER") {
    value = true;
  }else if(topsplit[0] == "2"){
    forcetake(2);
  }
  if(topsplit[1] == chosensplit[1]){
    value = true;
  }
  else if (topsplit[0] == chosensplit[0]){
    value = true;
  }


  if (value == true) {
    if(chosensplit[0] == "7"){
      next = false;
    }
    else if (chosensplit[0] == "8") {
      next = false;
    }
    else if (chosensplit[0] == "K") {
      next = false;
    }
    else if (chosensplit[0] == "B") {
      boer = true;
    }
  }
  console.log("value: " + value + "   next: " + next + "   boer: " + boer);
  return t = [value, next, boer];
};

AllPlayersReady = function(){
  for(var i in PLAYER_LIST){
    var player = PLAYER_LIST[i];
    if(player.ready != 1){
      return false;
    }
  }
  return true;
}

deelkaarten = function(pile){
  var deelnemers = Object.keys(PLAYER_LIST).length;
  for(var i in PLAYER_LIST){
    var player = PLAYER_LIST[i];
    player.hand = pile.slice(Math.max(pile.length - 7, 0));
    var pile = pile.slice(0, pile.length - 7);
    console.log(player.hand);
    hand = player.hand;
    SOCKET_LIST[i].emit("hand", hand);
  }
}

StartGame = function(){
  GAME_LIST[1] = Game();
  for(var i in PLAYER_LIST){
    var player = PLAYER_LIST[i];
    //geef player 1 de turn
    player.go = 1;
    turnchanged();
    break;
  }
}


turnchanged = function(){

    console.log(PLAYER_LIST);
  for(var i in PLAYING_LIST){
    var player = PLAYER_LIST[i];
    if(player.go == 1){
      console.log("EMITTING YOURTURN");
      io.emit("yourturn");
    }
    else{
      console.log("NOTYOURTURN");
      console.log(i);
      //SOCKET_LIST[i].emit("notyou");
      SOCKET_LIST[i].emit("notyou")
      //SOCKET_LIST[i].emit("notyou");
    }
  }
}

nextplayer = function(currentturn){

  Object.prototype.getKeyByValue = function( value ) {
      for( var prop in this ) {
          if( this.hasOwnProperty( prop ) ) {
               if( this[ prop ] == value ){
                   return prop;
                 }
          }
      }
  }

  var deelnemers = Object.keys(PLAYER_LIST).length;
  if(currentturn != PLAYING_LIST[deelnemers]){
    for(i in PLAYER_LIST){
      if(PLAYING_LIST[parseInt(PLAYING_LIST.getKeyByValue( currentturn)) + 1] == i){
        PLAYER_LIST[i].go = 1;
      }
      else {
        PLAYER_LIST[i].go = 0;
      }
    }
    currentturn = PLAYING_LIST[parseInt(PLAYING_LIST.getKeyByValue( currentturn)) + 1];
  }
  else{
    for(i in PLAYER_LIST){
      if(PLAYING_LIST[1] == i){
        PLAYER_LIST[i].go = 1;
      }
      else {
        PLAYER_LIST[i].go = 0;
      }

    }
    currentturn = PLAYING_LIST[1];

  }

  turnchanged();
  return currentturn;
}


goAgain = function(){

}
