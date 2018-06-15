"use strict";
var THREE = require('THREE');
var OrbitControls = require('three-orbit-controls')(THREE);
var dat = require("dat.gui");

const NUM_BRANCHES = 200;
const NUM_FADING_BRANCHES = 200;
const MAX_TREE_HEIGHT = 63000;
const SPREAD = 20000;
const Z_STEP = 100;
const START_COLOR = 0x63ff20;
const MID_COLOR = 0x12ad2a;
const FINAL_COLOR = 0xD57500;


var branchNumber = 0;
var branchGroup;
var fadingGroup;
var rotate = false;

var scene, camera, renderer, cameraControls;
var renderCount = 0;
var gui;

newInit();
render();


var values = {
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

function render() {
    requestAnimationFrame(render);
    if (rotate) {
        scene.rotation.x += 0.005;
        scene.rotation.y += 0.005;
        scene.rotation.z += 0.005;
    }
    updateScene();
    renderer.render(scene, camera);
};


function newInit() {
    gui = new dat.GUI();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000000);
    camera.position.x = MAX_TREE_HEIGHT * .66;
    camera.position.y = MAX_TREE_HEIGHT;
    camera.position.z = MAX_TREE_HEIGHT / 2;
    camera.lookAt(0, MAX_TREE_HEIGHT / 2, MAX_TREE_HEIGHT);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xffffff, 1);
    document.body.appendChild(renderer.domElement);

    cameraControls = new OrbitControls(camera, renderer.domElement);
    cameraControls.maxAzimuthAngle = Math.PI / 2;
    cameraControls.maxPolarAngle = Math.PI / 2;

    //orbit.enableZoom = false;

    var lights = [];
    lights[0] = new THREE.PointLight(0xffffff, 1, 0);
    lights[1] = new THREE.PointLight(0xffffff, 1, 0);
    lights[2] = new THREE.PointLight(0xffffff, 1, 0);

    lights[0].position.set(0, 2000, 0);
    lights[1].position.set(1000, 2000, 1000);
    lights[2].position.set(-1000, -2000, -1000);

    scene.add(lights[0]);
    scene.add(lights[1]);
    scene.add(lights[2]);

    fadingGroup = new THREE.Group();
    scene.add(fadingGroup);

    branchGroup = new THREE.Group();
    scene.add(branchGroup);

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
    let newBranch = createBranch(MAX_TREE_HEIGHT, SPREAD, Z_STEP);

    branchGroup.add(new THREE.Mesh(
        new THREE.TubeBufferGeometry(newBranch.curve, 300, 50, 8, false),
        newBranchMaterial())
    );

    if (branchGroup.children.length > NUM_BRANCHES) {
        let woof = branchGroup.children.shift();
        newFadingBranch(woof);
    }

}

function newFadingBranch(branch) {
    branch.material = newFadingMaterial();
    fadingGroup.add(branch);
}

function pruneBranches() {
    updateGrowingBranches();
    updateFadingBranches();
}

function updateGrowingBranches() {
    updateBranchGroupMaterial(
        branchGroup,
        (material, index) => material.opacity = (NUM_BRANCHES - index) / NUM_BRANCHES
    );
}


function updateFadingBranches() {
    if (fadingGroup && fadingGroup.children) {
        while (fadingGroup.children.length > NUM_FADING_BRANCHES) {
            fadingGroup.children.shift();
        }
        updateBranchGroupMaterial(
            fadingGroup,
            (material, index) => {
                material.opacity = index.map(0,NUM_FADING_BRANCHES,0.0,1.0);  //index / NUM_FADING_BRANCHES;
            }
        );
    }
}

function updateBranchGroupMaterial(group, materialUpdateFunction) {
    group.children.forEach((branch, index) => {

        materialUpdateFunction(branch.material, index);


        //branch.material.opacity = opacityFunction(index);
    });

}

function newFadingMaterial() {
    return new THREE.MeshPhongMaterial({
        color: 0xff0000,
        emissive: 0x000000,
        side: THREE.DoubleSide,
        flatShading: true,
        opacity: 1.0,
        transparent: true
    });
}

function newBranchMaterial() {
    return new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        emissive: 0x000000,
        side: THREE.DoubleSide,
        flatShading: true,
        opacity: 0.0,
        transparent: true
    });
}

function updateScene() {
    freshenBranches();
    pruneBranches();
    //updateGeometries();
    //updateLighting();
    //updateCamera();
    //processFadeouts();
}

// function mapNumber(number, inMin, inMax, outMin, outMax) {
//     return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
// }
Number.prototype.map = function (in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}