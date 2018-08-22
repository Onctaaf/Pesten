//endgame logica
//design


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
    currentturn: null,
    forcetake: 0
  }
  return self;
}

var io = require('socket.io') (serv, {});

//als er een nieuwe speler joint wordt deze functie aangeroepen.
io.on('connect', function(socket){
localStorage.setItem("currentturn", "undefined");
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
    localStorage.setItem("currentturn", "undefined");
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('userdisconnect');
    }

  });

  socket.on('ready', function(data){
    player.ready = 1;
    if(AllPlayersReady() == true){
      var pile = schudkaarten();
      deelkaarten(pile);
      StartGame();
      io.emit("topstackchange", {
        topstapel: 'EMPTY'
      });

    }
  })

  socket.on("passturn", function(){
    console.log("CURRENT TURN:   " + currentturn);
    currentturn = localStorage.getItem("currentturn");
    currentturn = nextplayer(currentturn);
    turnchanged();

      console.log("CURRENT TURN:   " + currentturn);
    localStorage.setItem("currentturn",  String(currentturn));
  })



  socket.on('status', function(data){
    console.log('ready status = ' + player.ready);
  })

  socket.on("kaartkopen", function(){
    pot = GAME_LIST["pot"]
    console.log("dit is dus de pot", pot);

    if (GAME_LIST["pot"].length < 7){
      reshuffle();
    }

    if(GAME_LIST[1]["forcetake"] == 0){
      toppot = pot[pot.length - 1];
      PLAYER_LIST[socket.id].hand.push(toppot)
      GAME_LIST["pot"].splice(-1,1);
      hand = PLAYER_LIST[socket.id].hand                                                /////////HIEEERR
      socket.emit("hand", hand);
    }
    else{
      var i = 0;
      while(i < GAME_LIST[1]["forcetake"]){
        i++;
        toppot = pot[pot.length - 1];
        PLAYER_LIST[socket.id].hand.push(toppot)
        GAME_LIST["pot"].splice(-1,1);
        hand = PLAYER_LIST[socket.id].hand                                                /////////HIEEERR
        socket.emit("hand", hand);
      }
      GAME_LIST[1]["forcetake"] = 0;
    }

  });


  socket.on('selectedcard', function(data){
    console.log(GAME_LIST)
    // if(localStorage.getItem("legstapel" != null)){
    //   var legstapel = localStorage.getItem("legstapel");
    // }
    // else{
    //   var legstapel = [];
    // }
    if(GAME_LIST[1]["forcetake"] == 0){
    var legstapel = GAME_LIST[1].legstapel;
    //console.log(PLAYER_LIST[socket.id].hand[data.card]);
    var infonext = dealnodeal(GAME_LIST[1].topstapel, PLAYER_LIST[id].hand[data.card]);
    //[value, next, boer]


    if(infonext[3] == true){
      SOCKET_LIST[id].emit("skip");
      if(localStorage.getItem("currentturn") == "undefined"){
        currentturn = PLAYING_LIST[1];
      }
      else{
        currentturn = localStorage.getItem("currentturn");
      }
      previousturn = currentturn;
      currentturn = nextplayer(currentturn);
      localStorage.setItem("currentturn",  String(currentturn));
    }
    if(infonext[2] == true){
      io.emit('Boerchoice');
    }
    if(infonext[0] == true && infonext[1] == true){
      io.emit('right');
      if(localStorage.getItem("currentturn") == "undefined"){
        currentturn = PLAYING_LIST[1];
      }
      else{
        currentturn = localStorage.getItem("currentturn");
      }
      currentturn = nextplayer(currentturn);
      localStorage.setItem("currentturn",  String(currentturn));
    }
    else if (infonext[0] == true && infonext[1] == false) {
      goAgain();
    }
    else{
      io.emit('wrong');
    }

    if(infonext[0] == true){
      legstapel.push(PLAYER_LIST[id].hand[data.card]);
      GAME_LIST[1].topstapel = PLAYER_LIST[id].hand[data.card];
      GAME_LIST[1].legstapel = legstapel;

      dearray = PLAYER_LIST[id].hand
      dearray.splice(data.card, 1);
      PLAYER_LIST[id].hand = dearray;
      SOCKET_LIST[id].emit("handchange", {
        card: data.card
      })
    };
    //for(var i in SOCKET_LIST){
      var socket = SOCKET_LIST[i];


      console.log("DIT IS DE CURRENT HAND DIE MISSCHIEN LEEG IS:    ", PLAYER_LIST[currentturn].hand[0])
      if(String(PLAYER_LIST[currentturn].hand[0]) == "undefined"){
        console.log("IEMAND HEEFT GEWONNEN    ", PLAYER_LIST[currentturn]);
        finishgame(PLAYER_LIST[socket.id]);
      }

      io.emit("topstackchange", {
        topstapel: GAME_LIST[1].topstapel
      });
    }
    else{
      SOCKET_LIST[id].emit("eerst kaarten pakken", {
        amount: GAME_LIST[1]["forcetake"]
      })
    }

    console.log(GAME_LIST[1].legstapel);
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
   var pile = ["2h", "3h", "4h", "5h", "6h", "7h", "8h", "9h", "th", "bh", "qh", "kh", "ah", "2d", "3d", "4d", "5d", "6d", "7d", "8d", "9d", "td", "bd", "qd", "kd", "ad", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s", "ts", "bs", "qs", "ks", "as", "2c", "3c", "4c", "5c", "6c", "7c", "8c", "9c", "tc", "bc", "qc", "kc", "ac", "joker", "joker"]
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
  var acht = false;
  if(topstack == "EMPTY"){
    next = true;
    value = true;
  }
  else if (topstack == "joker") {
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

  if (chosen == "joker") {
    forcetake(5);
    value = true;
  }else if(chosensplit[0] == "2"){
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
      next = true;
      acht = true;
    }
    else if (chosensplit[0] == "K") {
      next = false;
    }
    else if (chosensplit[0] == "B") {
      boer = true;
    }
  }
  return t = [value, next, boer, acht];
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
  GAME_LIST["pot"] = pile;
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
  for(var i in PLAYING_LIST){
    console.log(i);
  }
  for(var i in PLAYING_LIST){
    var player = PLAYER_LIST[PLAYING_LIST[i]];
    if(player.go == 1){
      SOCKET_LIST[PLAYING_LIST[i]].emit("yourturn");
    }
    else{
      //SOCKET_LIST[i].emit("notyou");
      SOCKET_LIST[PLAYING_LIST[i]].emit("notyou")
      //SOCKET_LIST[i].emit("notyou");
    }
  }
}

nextplayer = function(currentturn){

  // Object.prototype.getKeyByValue = function( value ) {
  //     for( var prop in this ) {
  //         if( this.hasOwnProperty( prop ) ) {
  //              if( this[ prop ] == value ){
  //                  return prop;
  //                }
  //         }
  //     }
  // }

  getKeyByValue = function( value , object) {
      for( var prop in object ) {
          if( object.hasOwnProperty( prop ) ) {
               if( object[ prop ] == value ){
                   return prop;
                 }
          }
      }
  }

  var deelnemers = Object.keys(PLAYER_LIST).length;
  if(currentturn != PLAYING_LIST[deelnemers]){
    for(i in PLAYER_LIST){
      // if(PLAYING_LIST[parseInt(PLAYING_LIST.getKeyByValue( currentturn)) + 1] == i){
         if(PLAYING_LIST[parseInt(getKeyByValue( currentturn, PLAYING_LIST)) + 1] == i){
        PLAYER_LIST[i].go = 1;
      }
      else {
        PLAYER_LIST[i].go = 0;
      }
    }
    currentturn = PLAYING_LIST[parseInt(getKeyByValue( currentturn, PLAYING_LIST)) + 1];
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

forcetake = function(amount){
  GAME_LIST[1]["forcetake"] = amount;
}

reshuffle = function(){

  legstapel = GAME_LIST[1].legstapel;
  console.log("CURRENT LEGSTAPEL:     ", legstapel);
  legstapellength = legstapel.length - 1;
  for(var i = 0; i<legstapellength; i++){
    GAME_LIST["pot"].push(legstapel[i]);
  }
  var save = legstapel[legstapel.length - 1];
  legstapel = [];
  legstapel.push(save);
  var pile = GAME_LIST["pot"];
  for (let i = pile.length - 1; i > 0; i--) {
       const j = Math.floor(Math.random() * (i + 1));
       [pile[i], pile[j]] = [pile[j], pile[i]];
   }
   GAME_LIST["pot"] = pile;
   GAME_LIST[1].legstapel = legstapel;

  console.log("LEGSTAPEL:     ", legstapel);
  console.log("POT:      ", GAME_LIST["pot"]);
}

finishgame = function(player){
      console.log("EMITTING FINISHED     ", player)
      io.emit("finished", {
        winner: player.id
      });
}
