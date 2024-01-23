//Make sure flask app is running first so that fetch requests work
//Use the command below to run:
//npx vite

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MapControls } from 'three/addons/controls/MapControls.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';

var JWT = localStorage.getItem('JWT');
// console.log(JWT);

//game without harry in: 655f41cb4c063e738be5bd16
//game with harry in: 655f41764c063e738be5bd02

//change this to read from local storage to get the game the user selected
const gameID = '65afdeb6d5431a537eeb1fb9';

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
      //This deletes everythign and re-renders the game (very inneficient but easier for now)
    unrenderUnit(units[0]);
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

const onRightClick = (event) => {
  if (overlaid == true) {
    return;
  }
  const currentSelected = selected;

  unhighlight(highlighted);

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    //console.log('man: ' + man.name);
    if (currentSelected.objectType == "unit") {
      const targetTileObject = intersects[0]['object'];
      console.log('target tile object: ', targetTileObject);
      const targetPosition = intersects[0]['object']['_id'];
      console.log('move target tile _id: ', targetPosition);
      const unitID = currentSelected._id;
      console.log('unit._id: ', unitID);
      console.log('move target tile _id: ', unitID);
      //Get position of right clicked tile
      // var targetPosition = intersects[0].object.position;

      const response = moveUnit(unitID, targetPosition)
      .then((response) => {
        console.log('response in onclick: ', response);
        if (response === 200) {
          //This deletes everything and re-renders the game (very inneficient but easier for now)
        console.log('highlighted before re-rendering: ', highlighted);
        currentSelected.a = targetTileObject.a;
        currentSelected.b = targetTileObject.b;
        currentSelected.c = targetTileObject.c;
        currentSelected.position.setX(targetTileObject.position.x);
        // currentSelected.position.setY(targetTileObject.position.y);
        currentSelected.position.setZ(targetTileObject.position.z);
        unhighlight(highlighted);
        // currentSelected.position.x = targetTileObject.x;
        // currentSelected.position.y = targetTileObject.y;
        // currentSelected.position.z = targetTileObject.z;
        
        // unrenderUnit(currentSelected);
        // scene.remove.apply(scene, scene.children);
        // renderGame();
  };
  });

      //Set the x and z position of the man to the right clicked tile

      // currentSelected.position.x = targetPosition.x;
      // currentSelected.position.z = targetPosition.z;
      // currentSelected.a = intersects[0].object.a;
      // currentSelected.b = intersects[0].object.b;
      // currentSelected.c = intersects[0].object.c;
    }
  }
  unhighlight(highlighted);

  //this should check that selected is a tile first, but there are only tiles so far

  let moveTiles = getMoves(selected, 2);
  highlight(moveTiles, 0x00ffff);

  let unitTile = getMoves(selected, 0);
  //console.log('unitTile');
  //console.log(unitTile);
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
    createUnit(tile.a, tile.b, tile.c, unit.name, unit.player, unit._id, tile)
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

function createUnit(a, b, c, name, player, _id, tile) {
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
