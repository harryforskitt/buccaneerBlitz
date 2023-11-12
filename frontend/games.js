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

listGames();