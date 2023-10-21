import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.CylinderGeometry( 5, 1, 1, 6 );
const geometry2 = new THREE.CylinderGeometry( 2, 2, 2, 32 );

let colorRota = [0xff0000, 0x00ff00, 0x0000ff, 0xff0000, 0x00ff00, 0x0000ff];
let material2 = new THREE.MeshBasicMaterial( {color: 0xffff00} );

const tiles = [];

var highlighted = [];

var moves;

function getMoves (unit, range){
  const a = unit.a;
  const lba = a - range;
  const uba = a + range;

  const b = unit.b;
  const lbb = b - range;
  const ubb = b + range;

  const c = unit.c;
  const lbc = c - range;
  const ubc = c + range;

  moves = [];

    for (let i = 0; i < tilesNumber; i++){

      var testa = tiles[i].a;
      //console.log('test a: ' + testa);

      var testb = tiles[i].b;
      //console.log('test b: ' + testb);

      var testc = tiles[i].c;
      //console.log('test c: ' + testc);

      if (lba <= tiles[i].a && uba >= tiles[i].a && lbb <= tiles[i].b && ubb >= tiles[i].b && lbc <= tiles[i].c && ubc >= tiles[i].c){
        if (a === testa && b === testb && c === testc){
          //console.log('skipped: '+ tiles[i].id);
        }
        else{
        //console.log('pushed: ' + tiles[i].id)
        moves.push(tiles[i].id);
        };
      };
    };
    return moves;
};


//note cyan highlight hex is 0x00ffff
//takes color as hex
//tiles should be an array of IDs
function highlight(tiles, color){
  for (let i = 0; i < tiles.length; i++){
    var target = scene.getObjectById(tiles[i]);
    //console.log(target);
    target.material.color.set(color);
  };
  console.log('highlight tiles: ' + tiles);
  highlighted = tiles;
  console.log('highlight highlighted: ' + highlighted);
};

function unhighlight(tiles){
  console.log('tiles: ' + tiles);
  console.log('highlighted: ' + highlighted);
  //You have to calculate the original length of the tiles array before the loop, becasue the splicing changes the indexes and makes it skip every other element
  length = tiles.length;
  for (let i = 0; i < length; i++){
    var target = scene.getObjectById(tiles[0]);
    //console.log('target: ');
    //console.log(target);
    target.material.color.setHex('0x'+target.startColor);
    //var tilesI = tiles[i];
    console.log('tiles[i] :' + tiles[0]);
    console.log('highlighted:');
    console.log(highlighted);
    var toRemove = highlighted.indexOf(tiles[0]);
    console.log('to remove: ' + toRemove);
    highlighted.splice(toRemove, 1);
  };
  //highlighted = [];
  console.log('unhighlight highlighted: ' + highlighted)
};

let k = 0;

for (let i = 0; i < 50; i++) {
    
    for (let j = 0; j < 50; j++) {
        let material = new THREE.MeshBasicMaterial( {color: colorRota[i%3]} );
        var hex = new THREE.Mesh( geometry, material )
        hex.a = -i - j;
        hex.b = ((2 * j) + (i));
        hex.c = -j;
    
        //console.log('color rota: ' + colorRota[i]);
        
        scene.add( hex )
        //console.log(hex);
        hex.startColor = hex.material.color.getHexString();
        //console.log('hex startColor: ' + hex.startColor);
        hex.translateX( i*4.3 );
        hex.translateZ( j*15+k );
        tiles.push(hex);
    }
    k+=7.5
  }

var tilesNumber = tiles.length;
//console.log(tiles);

var man = new THREE.Mesh( geometry2, material2 );
man.name = 'man';
scene.add( man );
man.translateY( 1 );
man.a = 0;
man.b = 0;
man.c = 0;


const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

var lastColor;
var lastObject;
var selected;

const onMouseClick = (event) => {
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
      if (lastObject != null){
        //Alternate method that doesn't work
          let lastObjectArray = [];
          lastObjectArray.push(lastObject.id);
          unhighlight(lastObjectArray);

        //Working method
        //lastObject.material.color.setHex('0x'+lastColor);
        //console.log(lastObject)
      };
      lastColor = intersects[0].object.material.color.getHexString();
      lastObject = intersects[0].object;
      //Set the color of the clicked object
      intersects[0].object.material.color.set(0xffffff);
      // const toHighlight = [];
      // toHighlight.push(intersects[0].object.id);
      // console.log('to highlight: ' + toHighlight)
      // highlight(toHighlight, 0xffffff);
    };
    
    selected = intersects[0].object;

    if (typeof moves != 'undefined'){
      unhighlight(highlighted);
    };
    
    moves = getMoves(intersects[0].object, 2);

    //console.log('moves: ' + moves);
    highlight(moves, 0x00ffff);
};

window.addEventListener('click', onMouseClick);

const onRightClick = (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    
    //console.log('man: ' + man.name);
    if (selected.name == 'man'){
      //Get position of right clicked tile
      var targetPosition = intersects[0].object.position

      //Set the x and z position of the man to the right clicked tile

      selected.position.x = targetPosition.x;
      selected.position.z = targetPosition.z;
      man.a = intersects[0].object.a;
      man.b = intersects[0].object.b;
      man.c = intersects[0].object.c;


    };
  };
  unhighlight(highlighted);
  highlight(getMoves(selected, 2), 0x00ffff);
};

window.addEventListener('contextmenu', onRightClick);

const controls = new OrbitControls( camera, renderer.domElement );
            controls.target.set( 10, 0, 40 );
            camera.position.x = 25;
            camera.position.y = 50;
            camera.position.z = 25;
            controls.update();
            controls.enablePan = false;
            controls.enableDamping = true;

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}

animate();