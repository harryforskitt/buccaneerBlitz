var JWT = '';

document.getElementById("login").onclick = async() => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    //Sets value of Global JWT variable
    JWT = await getJWT(username, password);
    console.log('JWT from login button: ', JWT);
    return JWT
  };

  const getJWT = async (username, password) => {
    const data = {
      'username' : username,
      'password' : password
    };
    const response = await fetch('http://127.0.0.1:5000/login', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    });
    const myJson = await response.json(); //extract JSON from the http response
    const JWT = (myJson.token);
    //console.log(JWT);
    localStorage.setItem('JWT', JWT);
    return JWT
  };

  const getUsername = async (JWT) => {
    const response = await fetch('http://127.0.0.1:5000/getUsername',{
      method: "GET",
      headers: {
        "Authorization" : JWT
      }
    });
    //await new Promise(r => setTimeout(r, 2000));
    //console.log(response);
    const myJson = response.json();
  return myJson
  };

  document.getElementById("getUsername").onclick = async() => {
  const response = await getUsername(JWT);
  console.log(response);
  return response
};