"use strict";

var THREE = require('THREE');
var OrbitControls = require('three-orbit-controls')(THREE);
var dat = require("dat.gui");
var io = require('socket.io-client');

const NUM_BRANCHES = 90;
const MAX_TREE_HEIGHT = 12000;
const SPREAD = 990;
const Z_STEP = 100;
const BRANCH_GROUP = "branchGroup";
const BRANCH_MATERIAL = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8
});

var branchNumber = 0;
var branches = [];
var branchGroup;


const ambient_light_name = 'ambientLight';
var scene, camera, renderer, cameraControls;
var renderCount = 0;
var gui;

var mesh;

var values = {
    kinectServer: 'http://localhost:8000',
    lights: {
        pointLights: [
            {
                intensity: 0.3,
                color: 0x990000,
                position: {
                    x: 0,
                    y: 0,
                    z: 400
                },
                name: 'light1'
            },
            {
                intensity: 0.3,
                color: 0x009900,
                position: {
                    x: 0,
                    y: 400,
                    z: 0
                },
                name: 'light2'
            },
            {
                intensity: 0.3,
                color: 0x000099,
                position: {
                    x: 400,
                    y: 0,
                    z: 0
                },
                name: 'light3'
            }
        ],
        ambientLight: {
            intensity: 0.22,
            color: 0x444444
        }
    },
    oscillatorTypes: [
        {
            name: 'sin',
            parameters: [
                {
                    name: 'freq',
                    description: 'frequency',
                    default: () => {
                        return 60;
                    }
                },
                {
                    name: 'count',
                    description: 'Number of cycles so far',
                    default: () => {
                        return 0;
                    }
                }
            ],
            value: (freq, count) => {
                if (freq() != 0) {
                    return Math.sin(count() / freq());
                } else {
                    console.error('dividing by zero thwarted');
                    return 0;
                }
            }
        }
    ],
    oscillators: [
        {
            name: 'sin60draw',
            type: 'sin',
            parameters: [
                {
                    name: 'freq',
                    valueFunc: () => 60
                },
                {
                    name: 'count',
                    valueFunc: () => renderCount
                }
            ]
        },
        {
            name: 'sin30draw',
            type: 'sin',
            parameters: [
                {
                    name: 'freq',
                    valueFunc: () => 30
                },
                {
                    name: 'count',
                    valueFunc: () => renderCount
                }
            ]
        },
        {
            name: 'sin20draw',
            type: 'sin',
            parameters: [
                {
                    name: 'freq',
                    valueFunc: () => 20
                },
                {
                    name: 'count',
                    valueFunc: () => renderCount
                }
            ]
        },
        {
            name: 'sin49draw',
            type: 'sin',
            parameters: [
                {
                    name: 'freq',
                    valueFunc: () => 49
                },
                {
                    name: 'count',
                    valueFunc: () => renderCount
                }
            ]
        }
    ]

};


newInit();
render();


function render () {
    renderCount++;
    requestAnimationFrame(render);
    updateScene();
    renderer.render(scene, camera);
};

function createCamera() {
    let newCam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000000);
    newCam.position.z = MAX_TREE_HEIGHT / 2;
    newCam.position.y = 0
    newCam.position.x = MAX_TREE_HEIGHT;
    newCam.lookAt(0,MAX_TREE_HEIGHT/2,0);

    return newCam;
}

function createRenderer() {
    let newRenderer = new THREE.WebGLRenderer({antialias: true});
    newRenderer.setPixelRatio(window.devicePixelRatio);
    newRenderer.setSize(window.innerWidth, window.innerHeight);
    newRenderer.setClearColor(0x000000, 1);

    return newRenderer;
}

function createCameraControls(camera, renderer) {
    let newCamControl = new OrbitControls(camera, renderer.domElement);
    newCamControl.maxAzimuthAngle = Math.PI/2;
    newCamControl.maxPolarAngle = Math.PI/2;

    return newCamControl;
}

function createLights(scene) {
    let lights = [];
    lights[0] = new THREE.PointLight(0xff0000, 1, 0);
    lights[1] = new THREE.PointLight(0x00ff00, 1, 0);
    lights[2] = new THREE.PointLight(0x0000ff, 1, 0);

    lights[0].position.set(0, 2000, 0);
    lights[1].position.set(1000, 2000, 1000);
    lights[2].position.set(-1000, -2000, -1000);

    scene.add(lights[0]);
    scene.add(lights[1]);
    scene.add(lights[2]);
}

function setupKinectSocket() {
    // connect
    return io.connect('http://192.168.1.78:8000/');
}



function newInit() {
    let kinectSocket = setupKinectSocket();

    kinectSocket.on('bodyFrame', (body) => {
        console.log(body);
    });


    gui = new dat.GUI();
    scene = new THREE.Scene();
    camera = createCamera();
    renderer = createRenderer();
    document.body.appendChild(renderer.domElement);

    cameraControls = createCameraControls(camera, renderer);
    createLights(scene);

    branchGroup = new THREE.Group();
    freshenBranches();
    scene.add(branchGroup);

    var render = function () {
        requestAnimationFrame(render);
        if ( ! options.fixed ) {
            mesh.rotation.x += 0.005;
            mesh.rotation.y += 0.005;
        }
        updateScene();
        renderer.render(scene, camera);
    };

    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);

}

function createBranch(treeHeight, spread, yStep) {
    let x = 0, y = 0, z = 0, unity;
    let points = [];
    while (y < treeHeight) {
        points.push(new THREE.Vector3(x, y, z));
        unity = Math.random() > .5 ? 1 : -1;
        x += (unity * Math.random() * spread * (y / treeHeight));
        unity = Math.random() > .5 ? 1 : -1;
        z += (unity * Math.random() * spread * (y / treeHeight));
        y += yStep;
    }

    return {
        curve: createCurveFromPoints(points),
        //geometry: getGeometryForBranch(),
        //material: getMaterialForBranch(),
        name: 'branch' + branchNumber++
    };
}

function createCurveFromPoints(curve) {
    return new THREE.CatmullRomCurve3(curve); //, false, 'chordal', 0.5);
}

function freshenBranches() {
    //if ( branches.length == 0) {
        let newBranch = createBranch(MAX_TREE_HEIGHT, SPREAD, Z_STEP);
        branches.push(newBranch);

        let geometry = new THREE.TubeBufferGeometry( newBranch.curve, 500, 5, 8, false );

        let material = new THREE.MeshPhongMaterial( {
            color: 0xffffff,
            emissive: 0xa72534,
            side: THREE.DoubleSide,
            flatShading: false
        } );

        let mesh = new THREE.Mesh( geometry, material );
        branchGroup.add(mesh);

        if (branches.length > NUM_BRANCHES) {
            branchGroup.children.shift();
        }
    //}
}

function updateScene() {
    freshenBranches();
    //updateGeometries();
    //updateLighting();
    //updateCamera();
    //processFadeouts();
}

