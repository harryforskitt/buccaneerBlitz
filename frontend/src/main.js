//Make sure flask app is running first so that fetch requests work
//Use the command below to run:
//npx vite

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MapControls } from 'three/addons/controls/MapControls.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';


var JWT = localStorage.getItem('JWT');
var gameID = localStorage.getItem('game')
console.log('game value from local Storage: ', gameID);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.CylinderGeometry(5, 1, 1, 6);
const geometry2 = new THREE.CylinderGeometry(2, 2, 2, 32);
const cityGeometry = new THREE.TetrahedronGeometry(2, 2, 2, 32);

const tiles = [];
const units = [];
const cities = [];

var highlighted = [];

var selected;

// Connect to the server using Socket.IO
var socket = io('http://127.0.0.1:5000/');

// Handle the 'connect' event
socket.on('connect', function() {
    console.log('Connected to server');
    // Emit a message to the server
    socket.emit('message', 'Hello from client!');
});

// Handle the 'message' event from the server
socket.on('message', function(msg){
    console.log(msg);
    // Emit a message back to the server (just an example)
    socket.emit('message', 'a');
});

// Listen for the 'unitDamaged' event from the server
socket.on('unitDamaged', function(data){
  console.log('Unit Damaged:', JSON.stringify(data));
  console.log('data.unit_id:', data.unit_id);
  // Update the health of the unit in the frontend
  updateUnitHealth(data.unit_id, data.damage);
});

// Function to update the health of a unit in the frontend
function updateUnitHealth(unitID, damage) {
  console.log('unitID', unitID)
  // Find the unit in the frontend scene by its ID
  var unit = scene.getObjectByProperty('_id', unitID);
  if (unit) {
      // Update the unit's health
      unit.hp = unit.hp - damage;
      // You may want to update the visual representation of the unit's health here
      console.log('Unit Health Updated:', unitID, unit.hp);
  } else {
      console.log('Unit not found:', unitID);
  }
}

socket.on('moveunit', function(msg){
  console.log(msg);
  console.log('msg.tile:', msg.tile);
  var unit = scene.getObjectByProperty('_id', (msg.unitID));
  var tile = scene.getObjectByProperty('_id', (msg.tile));
  console.log('unit', unit)
  console.log('tile', tile)
  unit.a = tile.a;
  unit.b = tile.b;
  unit.c = tile.c;
  unit.position.setX(tile.position.x);
  unit.position.setZ(tile.position.z);

  // Check if the moved unit is the currently selected unit
  if (selected && unit._id === selected._id) {
    // unhighlight
    unhighlight(highlighted);
  }
});

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
  return JWT
};

// document.getElementById("login").onclick = async() => {
//   const username = document.getElementById('username').value;
//   const password = document.getElementById('password').value;
//   //Sets value of Global JWT variable
//   JWT = await getJWT(username, password);
//   console.log('JWT from login button: ', JWT);
//   return JWT
// };

document.getElementById("moveUnit").onclick = async() => {
  console.log('unit to move: ', units[0]);
  const unitID = units[0]['_id'];
  console.log('unitID to move: ', unitID);
  const tile = "10";
  const response = moveUnit(unitID, tile)
  .then((response) => {
    console.log('response in onclick: ', response);
    if (response === 200) {

    unrenderUnit(units[0]);
    //This deletes everythign and re-renders the game (very inneficient but easier for now)
    // scene.remove.apply(scene, scene.children);
    // renderGame();
  };
  });
  
  return response;
};

const moveUnit = async (unitID, tile) => {
  var status
  const data = {
    "unitID": unitID,
    "tile": tile
  };
  console.log('gameID in moveUnit function: ', gameID)
  const response = await fetch('http://127.0.0.1:5000/moveUnit',{
    method: "POST",
    headers: {
      "gameID" : gameID,
      "Content-Type": "application/json",
      "authorization": JWT,
    },
    body: JSON.stringify(data)
  })
  
  .then((res) => {
    
    status = res.status
    console.log('response status: ', status)
    if (res.status === 400) {
      throw new Error('your error message here');
  }
  })
  return(status);

};

const getGame = async () => {
  const response = await fetch('http://127.0.0.1:5000/getGame',{
    method: "GET",
    headers: {
      "gameID" : gameID,
      "Content-Type": "application/json",
      "authorization": JWT
    }
  });
  const myJson = await response.json();
  // console.log("myJson: ", myJson);
  // console.log(myJson[0]);
  //console.log(myJson['map']);
  return(myJson);
  // do something with myJson
};

// console.log(getGame());

//const JWT = await getJWT('harry', 'password');
//console.log('JWT: ', JWT);

//This endpoint has been changed in the API, so this needs to be updated to load a game instead (probably from id in local storage)of creating one
//The create game and load game API endpoints should be updated to require authentication and have logic to check the user shoud have access to the game
const createGame = async () => {
  const response = await fetch('http://127.0.0.1:5000/createGame');
  console.log(response);
  const myJson = await response.json(); //extract JSON from the http response
  console.log(myJson);
  //console.log(myJson['map']);
  return(myJson);
  // do something with myJson
};

// const game = (await createGame());
// console.log(game['map']);
// //console.log(map);
// renderMap(game['map']);

const sendGame = async () => {
  const myJson = JSON.stringify(tiles);
  try{
    const response = await fetch('http://127.0.0.1:5000/post',{
      method: "POST",  //or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: myJson,
    });

    const result = await response.json();
    console.log("Success: ", result);
    } catch (error) {
      console.error("Error: ", error);
    }
};





var overlaid = false;
const overlay = document.getElementById("test");
overlay.onmouseenter = function () {
  overlaid = true;
  // console.log("overlaid: " + overlaid);
};
overlay.onmouseleave = function () {
  overlaid = false;
  // console.log("overlaid: " + overlaid);
};

document.getElementById("createCity").onclick = function () {
  createCity(selected.a, selected.b, selected.c, "city");
};

function createCity(a, b, c, name) {
  const tile = scene.getObjectById(getTile(a, b, c));
  const material = new THREE.MeshBasicMaterial({ color: 0x996600 });
  const city = new THREE.Mesh(cityGeometry, material);
  city.name = name;
  scene.add(city);
  city.translateY(1);
  console.log(tile.position.x);
  city.position.setX(tile.position.x);
  city.translateY(1);
  city.position.setZ(tile.position.z);
  city.a = a;
  city.b = b;
  city.c = c;
  city.startColor = city.material.color.getHexString();
  cities.push(city);
  return city;
}

function getMoves(unit, range) {
  //console.log('unit :');
  // console.log('unit:, ', unit);
  const a = unit.a;
  // console.log('a:, ', a);
  const lba = a - range;
  // console.log('lba:, ', lba);
  const uba = a + range;
  // console.log('uba:, ', uba);

  const b = unit.b;
  const lbb = b - range;
  const ubb = b + range;

  const c = unit.c;
  const lbc = c - range;
  const ubc = c + range;

  //console.log(c);

  let moves = [];
  console.log('tilesNumber: ', tilesNumber);
  for (let i = 0; i < tilesNumber; i++) {
    var testa = tiles[i].a;
    var testb = tiles[i].b;
    var testc = tiles[i].c;
    var tile = scene.getObjectByProperty('_id', tiles[i])
    // console.log('tiles[i].a: ', tiles[i].a);
    // console.log ("getObjectByProperty('_id', tiles[i]).a: ", scene.getObjectByProperty('_id', tiles[i]).a);
    if (
      lba <= tile.a &&
      uba >= tile.a &&
      lbb <= tile.b &&
      ubb >= tile.b &&
      lbc <= tile.c &&
      ubc >= tile.c
    ) {
      // console.log('adding tile to highlight: ', tiles[i])
      moves.push(tiles[i]);
    }
  }
  //console.log('moves:');
  console.log('moves', moves);
  return moves;
}

//Get a tile's id from its a, b and c coordinates
function getTile(a, b, c) {
  //console.log(a);
  //console.log(b);
  //console.log(c);
  var tile;
  const tilesNumber = tiles.length;
  for (let i = 0; i < tilesNumber; i++) {
    //console.log(a);
    if (a == tiles[i].a && b == tiles[i].b && c == tiles[i].c) {
      tile = tiles[i]._id;
    }
  }
  return tile;
}

const getMouseIntersects = (event) => {
  //console.log(event);
  // calculate pointer position in normalized device coordinates
  // (-1 to +1) for both components
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  // console.log('mouse pointer x: ', pointer.x);
  // console.log('event.clientX: ', event.clientX);
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  // console.log('mouse pointer y: ', pointer.y);
  // console.log('event.clientY: ', event.clientY);

  raycaster.setFromCamera(pointer, camera);
  //console.log(raycaster.intersectObjects(scene.children));
  return raycaster.intersectObjects(scene.children);
};

//returns the first object directly infront of the camera
const getCameraIntersects = () => {
  pointer.x = 0;
  pointer.y = 0;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(scene.children);
};

// Function to display specific properties of the selected unit in the test div
const displayUnitProperties = () => {
    // Check if a unit is selected
    if (selected) {
        // Create an HTML string to display unit properties
        let htmlContent = '<h2>Unit Properties</h2>';
        htmlContent += '<ul>';
        
        // Define the properties to display
        const propertiesToDisplay = ['a', 'b', 'c', 'name', 'player', '_id', 'tile', 'type', 'movepoints', 'hp', 'attackdistance', 'attackdamage', 'maxattacks'];
        
        // Iterate over the properties to display
        propertiesToDisplay.forEach(property => {
            // Check if the property exists in the selected unit object
            if (selected.hasOwnProperty(property)) {
                htmlContent += '<li><strong>' + property + ':</strong> ' + selected[property] + '</li>';
            }
        });

        htmlContent += '</ul>';

        // Update the content of the test div
        document.getElementById('unitinfo').innerHTML = htmlContent;
    } else {
        // If no unit is selected, clear the content of the test div
        document.getElementById('unitinfo').innerHTML = '';
    }
};

//takes color as hex
//tiles should be an array of IDs
function highlight(tiles, color) {
  // console.log("color: " + color);
  // console.log(tiles);
  //console.log('tiles in highlight function:');
  //console.log(tiles);
  for (let i = 0; i < tiles.length; i++) {
    // console.log('tiles in highlight: ', tiles);
    // console.log('tiles[i]: ',tiles[i])
    var target = scene.getObjectByProperty('_id', tiles[i]);
    //console.log('target in highlight function:');
    // console.log('target in highlight function:', target);
    target.material.color.set(color);
    highlighted.push(target._id);
  }
  //console.log('highlight tiles: ' + tiles);
  // highlighted = tiles;
  //console.log('highlight highlighted: ' + highlighted);
}

function unhighlight(tiles) {
  //console.log('tiles: ' + tiles);
  //console.log('highlighted: ' + highlighted);
  //You have to calculate the original length of the tiles array before the loop, becasue the splicing changes the indexes and makes it skip every other element
  length = tiles.length;
  for (let i = 0; i < length; i++) {
    console.log('tiles in unhighlight: ', tiles);
    console.log('tiles in highlighted: ', highlighted);
    var target = scene.getObjectByProperty('_id', tiles[0]);
    //console.log('target: ');
    //console.log(target);
    console.log('target: ', target);
    target.material.color.setHex("0x" + target.startColor);
    //var tilesI = tiles[i];
    //console.log('tiles[i] :' + tiles[0]);
    //console.log('highlighted:');
    //console.log(highlighted);
    var toRemove = highlighted.indexOf(tiles[0]);
    console.log('index to remove from highlighted: ', toRemove);
    //console.log('to remove: ' + toRemove);
    highlighted.splice(toRemove, 1);
  }
  console.log('highlighted after unhighlighting: ', highlighted);
  //highlighted = [];
  //console.log('unhighlight highlighted: ' + highlighted);
}

const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

var selected;

const onMouseClick = (event) => {
  if (overlaid == true) {
    return;
  }

  //console.log('highlighted before clearing:');
  //console.log(highlighted);
  console.log('highlighted: ', highlighted);
  if (highlighted.length > 0){
    unhighlight(highlighted);
  };

  let intersects = getMouseIntersects(event);

  if (intersects.length > 0) {
    selected = intersects[0].object;
    console.log("Selected: ", selected)
    let toHighlight = [selected._id];
    console.log('toHighlight: ', toHighlight);

    //change this to check that the type of the object is a unit
    // console.log('selected.objectType: ', selected.objectType);
    if (selected.objectType == "unit") {

      // Call the function to initially display the specific unit properties
      displayUnitProperties();

      //console.log('toHighlight:');
      //console.log(toHighlight);
      // console.log("toHighlight: ");
      // console.log(toHighlight);
      highlight(toHighlight, 0xff00ff);

      // console.log('selected in onMouseClick: ', selected);

      let moveTiles = getMoves(selected, 2);
      console.log('move tiles: ', moveTiles);
      highlight(moveTiles, 0x00ffff);
      let unitTile = getMoves(selected, 0);
      //console.log('unitTile');
      //console.log(unitTile);
      highlight(unitTile, 0xffffff);
    }
    //change this to else if the type of selected is a tile
    else {
      highlight(toHighlight, 0xffffff);
    }
  }
};

window.addEventListener("click", onMouseClick);

// Function to get the ID of the unit from the specified tile object
const getUnitIDFromTile = (tileObject) => {
  // Iterate through the units array
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    // Check if the unit is located on the specified tile
    if (unit.a === tileObject.a && unit.b === tileObject.b && unit.c === tileObject.c) {
      // Return the ID of the unit
      return unit._id;
    }
  }
  // If no unit is found on the specified tile, return null or handle appropriately
  return null;
};

const onRightClick = (event) => {
  if (overlaid == true) {
    return;
  }

  // Get the currently selected unit
  const currentSelected = selected;

  // Unhighlight any previously highlighted tiles
  unhighlight(highlighted);

  // Calculate the mouse pointer position
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Cast a ray from the camera to detect intersections with objects in the scene
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    // Check if the currently selected object is a unit
    if (currentSelected && currentSelected.objectType === 'unit') {
      const targetTileObject = intersects[0].object;
      const targetTileID = targetTileObject._id;

      // Check if the selected tile has a unit on it
      const isTargetTileOccupied = units.some(unit => unit._id === targetTileID);

      if (!isTargetTileOccupied) {
        // If the target tile is empty, attempt to move the unit
        const unitID = currentSelected._id;
        moveUnit(unitID, targetTileID)
          .then((response) => {
            console.log('Response from moveUnit endpoint: ', response);
            // Handle the response as needed
          })
          .catch((error) => {
            console.error('Error moving unit: ', error);
            // Handle errors
          });
      } else {
        // If the target tile is occupied, attempt to attack the unit
        const attacker_unit_ID = currentSelected._id;
        const target_unit_ID = getUnitIDFromTile(targetTileObject);
        attackUnit(attacker_unit_ID, target_unit_ID)
          .then((response) => {
            console.log('Response from attackUnit endpoint: ', response);
            // Handle the response as needed
          })
          .catch((error) => {
            console.error('Error attacking unit: ', error);
            // Handle errors
          });
      }
    }
  }

  // Unhighlight any previously highlighted tiles
  unhighlight(highlighted);

  // Highlight moveable tiles and the currently selected tile
  let moveTiles = getMoves(selected, 2);
  highlight(moveTiles, 0x00ffff);
  let unitTile = getMoves(selected, 0);
  highlight(unitTile, 0xffffff);
  let toHighlight = [selected._id];
  highlight(toHighlight, 0xff00ff);
};

window.addEventListener("contextmenu", onRightClick);

//Create map

function renderMap(map) {
  // console.log('map: ', map);
  for (let i = 0; i < Object.keys(map).length; i++){
    let material = new THREE.MeshBasicMaterial({ color: map[i]['color'] });
    var hex = new THREE.Mesh(geometry, material);
    //console.log('i: ', i);
    //console.log('map[i]: ', map[i]);
    //console.log('map[i][a]: ', map[i]['a']);

    //should do this programatticaly instead of setting each value
    hex._id = map[i]['_id']['$oid'];
    hex.a = map[i]['a'];
    hex.b = map[i]['b'];
    hex.c = map[i]['c'];
    hex.i = map[i]['i'];
    hex.j = map[i]['j'];
    hex.k = map[i]['k'];
    hex.color = map[i]['color'];
    hex.startColor = map[i]['startColor'];
    
    // console.log('hex: ', hex);
    scene.add(hex);
    //console.log(hex);
    hex.startColor = hex.material.color.getHexString();
    //console.log('hex startColor: ' + hex.startColor);
    hex.translateX(hex.i * 4.3);
    hex.translateZ(hex.j * 15 + hex.k);
    // console.log('pushing hex: ', hex._id)
    tiles.push(hex._id);
  };
  tilesNumber = tiles.length;
  // console.log('beginning tiles: ', tiles);

};

const renderGame = async () => {
  const game = getGame()
  .then((finalResult) => {
  // console.log('res game: ', finalResult['0']['tiles']);
  renderMap(finalResult['0']['tiles']);
  // console.log('tiles: ', tiles);
  // console.log('render map called');
  renderUnits(finalResult['0']['units']);
  });
};

function renderUnits(units){
  // console.log('units: ', units);
  for (let i = 0; i < Object.keys(units).length; i++){
    const unit = units[i]
    // console.log('unit: ', unit);
    const tile_id = (unit['tile']['$oid'])
    // console.log("unit tile: ", tile_id);
    const tile = scene.getObjectByProperty('_id', (tile_id));
    // const tile = scene.getObjectByProperty('_id', 10);
    // console.log('tile: ', tile);
    createUnit(tile.a, tile.b, tile.c, unit.name, unit.player, unit._id, tile, unit.type, unit.movepoints, unit.hp, unit.attackdistance, unit.attackdamage, unit.maxattacks)
  };
};

function unrenderUnit(selected){
  console.log('selected before removal: ', (scene.getObjectById(selected.id)));
  (scene.getObjectById(selected.id)).geometry.dispose();
  (scene.getObjectById(selected.id)).material.dispose()
  scene.remove((scene.getObjectById(selected.id)));
  // for (const key in selected) {
  //   delete selected[key];
  // };
  renderer.renderLists.dispose();
  console.log('selected after removal: ', (scene.getObjectById(selected.id)));
};

// console.log('console log of await (getGame):', await(getGame));
renderGame();

function createUnit(a, b, c, name, player, _id, tile, type, movepoints, hp, attackdistance, attackdamage, maxattacks) {
  // const tile = scene.getObjectByProperty('_id', getTile(a, b, c));
  // console.log('tile in create unit: ', tile);
  const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const unit = new THREE.Mesh(geometry2, material);
  unit._id = _id['$oid'];
  unit.objectType = 'unit';
  unit.name = name;
  unit.player = player;
  scene.add(unit);
  unit.translateY(1);
  // console.log(tile.position.x);
  unit.position.setX(tile.position.x);
  unit.translateY(1);
  unit.position.setZ(tile.position.z);
  unit.a = a;
  unit.b = b;
  unit.c = c;
  unit.startColor = unit.material.color.getHexString();
  unit.type = type;
  unit.movepoints = movepoints
  unit.hp = hp
  unit.attackdistance = attackdistance
  unit.attackdamage = attackdamage
  unit.maxattacks = maxattacks
  units.push(unit);
  // console.log('created unit: ', unit)
  return unit;
}

//const man = createUnit(0, 0, 0, "man", "settler");
//console.log("man id: " + man.id);

//const man2 = createUnit(-1, 1, 0, "man", "warrior");
//console.log("man2 id: " + man2.id);

//highlight([man2.id], 0x000000);

// let man = new THREE.Mesh( geometry2, material2 );
// man.name = 'man';
// scene.add( man );
// man.translateY( 1 );
// man.a = 0;
// man.b = 0;
// man.c = 0;
// man.startColor = man.material.color.getHexString();

const secondTile = scene.getObjectById(getTile(-1, 1, 0));
//onsole.log(secondTile);

//let man = new THREE.Mesh( geometry2, material2 );
// man.name = 'man';
// scene.add( man );
// console.log(secondTile.position.x);
// man.position.setX(secondTile.position.x);
// man.translateY( 1 );
// man.position.setZ(secondTile.position.z);
// man.a = -1;
// man.b = 1;
// man.c = 0;
// man.startColor = man.material.color.getHexString();

var tilesNumber;
//console.log(tiles);


window.addEventListener("keydown", onKeyDown);

function onKeyDown(evt){
  if (evt.keyCode == "38"){
    console.log('up arrow press detected');
    camera.translateY( 10 );
  };
  if (evt.keyCode == "40"){
    console.log('down arrow press detected');
    camera.translateY( - 10 );
  };
  if (evt.keyCode == "37"){
    console.log('down arrow press detected');
    camera.translateX( - 10 );
  };
  if (evt.keyCode == "39"){
    console.log('down arrow press detected');
    camera.translateX( 10 );
  };
  
};

// Add the event listener for right-clicks
window.addEventListener("contextmenu", onRightClick);

// Function to send a request to the backend to attack a unit
const attackUnit = async (attacker_unit_ID, defender_unit_ID) => {
  // Prepare the data to send in the request
  console.log('attacker_unit_ID in attackUnit function: ', attacker_unit_ID)
  console.log('defender_unit_ID in attackUnit function: ', defender_unit_ID)

  const data = {
    
    "attacker_unit_ID": attacker_unit_ID,
    "defender_unit_ID": defender_unit_ID
  };

  try {
    // Send a POST request to the backend's /attackUnit endpoint
    const response = await fetch('http://127.0.0.1:5000/attackUnit', {
      method: "POST",
      headers: {
        "gameID": gameID,
        "Content-Type": "application/json",
        "authorization": JWT
      },
      body: JSON.stringify(data)
    });

    // Parse the JSON response
    const responseData = await response.json();

    // Return the response data
    return responseData;
  } catch (error) {
    // Handle any errors that occur during the fetch request
    console.error('Error attacking unit: ', error);
    throw error;
  }
};


const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(10, 0, 40);
camera.position.x = 25;
camera.position.y = 50;
camera.position.z = 25;
controls.update();
controls.enablePan = true;
controls.enableDamping = true;

function animate() {
  try{
    const target = getCameraIntersects()[0].object
    // console.log('target: ', target);
    controls.target.set(target.position.x, target.position.y, target.position.z);
    }
    catch{}
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
