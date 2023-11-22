const JWT = localStorage.getItem('JWT');
console.log(JWT);

const gamesList = document.getElementById('gamesList');

const listGames = async () => {
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
      console.log(await result);
      console.log("Success: ", result);
      console.log('result length: ', result.length);
      for (let i = 0; i < result.length; i++) {
        const li = document.createElement('li');
        console.log(result[i].name);
        //const game = document.createTextNode(result[i].name);
        li.appendChild(document.createTextNode(result[i].name));
        gamesList.appendChild(li);

      }
    //   gamesList.innerHTML = await result[0].name;
      } catch (error) {
        console.error("Error: ", error);
      }
};

const createGame = async (name) => {
  const data = {
    'name' : name
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
  const game = await createGame('newname');
  if (game != null){
    const li = document.createElement('li');
    //const game = document.createTextNode(result[i].name);
    li.appendChild(document.createTextNode(game));
    gamesList.appendChild(li);
  }
  else{
    console.log('failed to make game')
    }
};

listGames();