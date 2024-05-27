const JWT = localStorage.getItem('JWT');
console.log(JWT);

const gamesList = document.getElementById('gamesList');

const playersList = document.getElementById('players');

function addPlayer(){

  var player = document.createElement('tr');

  var playerNametd = document.createElement('td');
  var playerNameInput = document.createElement('input');
  playerNameInput.classList = 'playerName';
  playerNametd.appendChild(playerNameInput);

  var piratetd = document.createElement('td');
  var pirateInput = document.createElement('input');
  pirateInput.type = 'checkbox';
  pirateInput.classList = 'isPirate';
  piratetd.appendChild(pirateInput);
  
  var AItd = document.createElement('td');
  var AIInput = document.createElement('input');
  AIInput.type = 'checkbox';
  AIInput.classList = 'isAI';
  AItd.appendChild(AIInput);
  
  var removePlayertd = document.createElement('td');
  var removePlayerbutton= document.createElement('button');
  removePlayerbutton.classList = 'remove';
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
        
        const players = [];

        for (let j = 0; j < result[i].players.length; j++){
          console.log('result[i]: ', result[i]);
          console.log('result[i].players: ', result[i].players);
          // console.log('JSON.stringify(result[i].players): ', JSON.stringify(result[i].players));
          console.log('result[i].players[j]: ', JSON.stringify(result[i].players[j]));
          console.log("result[i].players[j]['name']: ", JSON.stringify(result[i].players[j]['name']));
          players.push(result[i].players[j]['name'])
        };

        console.log('players: ', players);

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
        li.appendChild(document.createTextNode(result[i].name + ' id: ' + result[i]._id['$oid'] + ' players: ' + players));
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
  // const playersElement = document.getElementById("players").getElementsByClassName('playerName');
  const playersElement = document.getElementById("players");
  console.log("players element: ", playersElement);
  const playerNames = playersElement.getElementsByClassName('playerName');
  const name = document.getElementById("gameName").value;
  for (let i = 0; i < playerNames.length; i++) {
    const player = {};
    player.name = playerNames[i].value;

    var playerIsPirateCheckbox = playersElement.getElementsByClassName('isPirate')[i];
    var playerIsPirate = playerIsPirateCheckbox.checked;
    console.log("playerIsPirate: ", playerIsPirate);
    player.isPirate = playerIsPirate;

    var playerIsAICheckbox = playersElement.getElementsByClassName('isAI')[i];
    var playerIsAI = playerIsAICheckbox.checked;
    player.isAI = playerIsAI;

    // console.log("playerIsPirateCheckbox: ", playerIsPirateCheckbox);
    console.log('player ', i);
    console.log(playerNames[i].value);
    players.push(player);
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