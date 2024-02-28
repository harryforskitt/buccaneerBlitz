const JWT = localStorage.getItem('JWT');
console.log(JWT);

const gamesList = document.getElementById('gamesList');

const playersList = document.getElementById('players');

function addPlayer(){

  var player = document.createElement('tr');

  var playerNametd = document.createElement('td');
  var playerNameInput = document.createElement('input');
  playerNameInput.className = 'playerName'
  playerNametd.appendChild(playerNameInput);

  var piratetd = document.createElement('td');
  var pirateInput = document.createElement('input');
  pirateInput.type = 'checkbox';
  piratetd.appendChild(pirateInput);
  
  var AItd = document.createElement('td');
  var AIInput = document.createElement('input');
  AIInput.type = 'checkbox';
  AItd.appendChild(AIInput);
  
  var removePlayertd = document.createElement('td');
  var removePlayerbutton= document.createElement('button');
  removePlayerbutton.className = 'remove';
  removePlayerbutton.innerHTML = 'Remove Player';

  removePlayerbutton.onclick = function(event){
    console.log('remove button clicked');
    var button = event.target;
    var td = button.parentElement;
    var tr = td.parentElement;
    tr.remove();
  };

  removePlayertd.appendChild(removePlayerbutton);
  
  player.append(playerNametd, piratetd, AItd, removePlayertd);
  playersList.appendChild(player);
};

for(let i = 0; i < 4; i++){
  addPlayer();
};


document.getElementById("addPlayer").onclick = function(){
  addPlayer();
};


// document.getElementsByClassName("remove").onclick = function(){
//   console.log('remove button clicked');
//   //get the table row that is the parent of the remove button, and remove this row
//   // var td = event.target;
//   // console.log('event target: ', td);
// };


const listGames = async() => {
    //const myJson = JSON.stringify(tiles);
    try{
      const response = await fetch('http://127.0.0.1:5000/listGames',{
        method: "GET",
        headers: {
          "Authorization" : JWT,
          "Content-Type": "application/json",
        }
      });
  
      //const result = await response.json();
      const result = await response.json();
      // console.log(await result);
      // console.log("Success: ", result);
      // console.log('result length: ', result.length);
      gamesList.innerHTML = "";
      
      for (let i = 0; i < result.length; i++) {
        const li = document.createElement('li');
        // console.log(result[i].name);
        //const game = document.createTextNode(result[i].name);
        // console.log(result[i].players);
        var button = document.createElement('button');
        button.innerHTML = 'Play';
        button.setAttribute('id', result[i]._id['$oid']);
        button.onclick = function() {
          localStorage.setItem('game', this.id);
          console.log('game value from local Storage: ', localStorage.getItem('game'));
          window.location.href = 'http://127.0.0.1:5000/game';
        };
        li.appendChild(button);
        li.appendChild(document.createTextNode(result[i].name + ' id: ' + result[i]._id['$oid'] + ' players: ' + result[i].players));
        gamesList.appendChild(li);

      }
    //   gamesList.innerHTML = await result[0].name;
      } catch (error) {
        console.error("Error: ", error);
      }
};

const createGame = async (name, players) => {
  const data = {
    'name': name,
    'players': players
  };
  try{
    const response = await fetch('http://127.0.0.1:5000/createGame',{
      method: "POST",
      headers: {
        "Authorization" : JWT,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    });
  return(name)
  } catch (error) {
    console.error("Error: ", error);
    return(null)
  }

};

document.getElementById("createGame").onclick = async() => {
  const players = []
  const playersInput = document.getElementById("players").getElementsByClassName('playerName');
  const name = document.getElementById("gameName").value;
  for (let i = 0; i < playersInput.length; i++) {
    console.log('player ', i)
    console.log(playersInput[i].value);
    players.push(playersInput[i].value);
  };
  //console.log(players);
  
  const game = await createGame(name, players);
  if (game != null){
    // const li = document.createElement('li');
    //const game = document.createTextNode(result[i].name);
    // li.appendChild(document.createTextNode(game));
    // gamesList.appendChild(li);
    listGames();
  }
  else{
    console.log('failed to make game')
    }
};

listGames();