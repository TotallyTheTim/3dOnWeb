import * as THREE from './three.js';

import { DDSLoader } from './loaders/dss.js';
import { MTLLoader } from './loaders/mtl.js';
import { OBJLoader } from './loaders/obj.js';

import { EffectComposer } from './effects/effectComposer.js';
import { RenderPass } from './effects/renderPass.js';
import { BloomPass } from './effects/bloomPass.js';
import { UnrealBloomPass } from './effects/unrealBloomPass.js';

let cube;
let obj;
let composer;
var container;

var camera, scene, renderer;

var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;


let name = 'myFace';

init();
animate();

const geometry = new THREE.PlaneGeometry(
    100,
    100,
    22,
    22
);
var material = new THREE.MeshPhongMaterial( {color: 0x333333} );
cube = new THREE.Mesh( geometry, material );
cube.position.z -=100;
// cube.scale.x = 2;
// cube.scale.y = 2;

geometry.vertices.forEach((geom, index) => {
    geom.z = Math.random()*50-2.5;
});
cube.receiveShadow = true;
cube.castShadow = true;

scene.add( cube );

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.position.z = 250;

    // scene

    scene = new THREE.Scene();

    var ambientLight = new THREE.AmbientLight( 0xcccccc, .5 );
    scene.add( ambientLight );

    var pointLight = new THREE.PointLight( 0xffffff, 0.7 );
    camera.add( pointLight );
    scene.add( camera );

    // model

    var onProgress = function ( xhr ) {

        if ( xhr.lengthComputable ) {

            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log( Math.round( percentComplete, 2 ) + '% downloaded' );

        }

    };

    var onError = function () { };

    var manager = new THREE.LoadingManager();
    manager.addHandler( /\.dds$/i, new DDSLoader() );

    // comment in the following line and import TGALoader if your asset uses TGA textures
    // manager.addHandler( /\.tga$/i, new TGALoader() );

    new MTLLoader( manager )
        .setPath( './model/' )
        .load( name + '.mtl', function ( materials ) {

            materials.preload();

            new OBJLoader( manager )
                .setMaterials( materials )
                .setPath( './model/' )
                .load( name + '.obj', function ( object ) {

                    object.position.y = 0;
                    object.scale.x = 25;
                    object.scale.y = 25;
                    object.scale.z = 25;
                    scene.add( object );
                    obj = object;

                }, onProgress, onError );

        } );

    //

    renderer = new THREE.WebGLRenderer( { alpha: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );
    container.id = "container";


    var renderScene = new RenderPass( scene, camera );
    // renderScene.clear=false;
    renderScene.autoClear=false

    var params = {
        exposure: .5,
        bloomStrength: .5,
        bloomThreshold: .1,
        bloomRadius: .2
    };

    var bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;

    bloomPass.radius = params.bloomRadius;

    const alpha = renderer.getContext().getContextAttributes().alpha;

    composer = new EffectComposer( renderer );
    composer.addPass( renderScene );
    composer.addPass( bloomPass );

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );

    //

    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {
    console.log(obj);
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {

    mouseX = ( event.clientX - windowHalfX ) * 1.5;
    mouseY = ( event.clientY - windowHalfY ) * 1.5;

}

//

function animate() {

    if (cube) {
        cube.geometry.vertices.forEach((geom, index) => {
            geom.z += Math.random() * 5 - 2.5;
            if (geom.z > 250 || geom.z < 250) {
                geom.z /= 1.02;
            }
        });
        cube.geometry.verticesNeedUpdate = true;
    }
    requestAnimationFrame( animate );
    render();

}

function render() {

    camera.position.x += -( mouseX + camera.position.x ) * .5;
    camera.position.y += -( - mouseY + camera.position.y ) * .5;

    if (obj){
        obj.rotation.y = mouseX/window.innerWidth*.8;
        obj.rotation.x = mouseY/window.innerHeight*.8;
    }

    camera.lookAt( scene.position );

    renderer.render( scene, camera );
    renderer.clearDepth();
    composer.render();

}