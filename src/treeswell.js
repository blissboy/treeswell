"use strict";

const ambient_light_name = 'ambientLight';
var scene, camera, renderer, cameraControls;
var renderCount = 0;
var gui;

var mesh;


var values = {
    bubble: {
        radius: 300,
        latitudePoints: 29,
        longitudePoints: 7,
        color: 0xff00ff
    },
    tubes: {
        controlType: 'dynamic',
        static: {
            color: 0xeeeeee
        },
        dynamic: {
            oscillator: 'sin60draw',
            color: {
                rMin: 255,
                rMax: 12,
                gMin: 0,
                gMax: 128,
                bMin: 20,
                bMax: 255
            }
        }
    },
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
            color: 0xffffff
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

var render = function () {
    renderCount++;
    requestAnimationFrame(render);
    updateScene();
    renderer.render(scene, camera);
};

function newInit() {
    gui = new dat.GUI();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000000);
    //camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 3000;

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    document.body.appendChild(renderer.domElement);

    cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
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

    //mesh = new THREE.Object3D();

    createTree();
    //drawPlane();
    drawNormalToXY(1000);

    var prevFog = false;

    var render = function () {
        requestAnimationFrame(render);
        // if ( ! options.fixed ) {
        //     mesh.rotation.x += 0.005;
        //     mesh.rotation.y += 0.005;
        // }
        updateScene();
        renderer.render(scene, camera);
    };

    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);

}

function drawPlane() {
    var geometry = new THREE.PlaneGeometry( 2500, 2500, 32, 32 );
    var material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
    var plane = new THREE.Mesh( geometry, material );
    scene.add( plane );
}

function drawNormalToXY(length) {

    let normalCurve = new THREE.LineCurve3( new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,length));

    let geometry = new THREE.TubeGeometry( normalCurve, 20, 2, 8, false );
    let material = new THREE.MeshBasicMaterial( { color: 0xFFff00 } );
    let normalMesh = new THREE.Mesh( geometry, material );
    scene.add( normalMesh );
}


function createBranch(treeHeight, spread, zStep) {
    let x = 0, y = 0, z = 0, unity;
    let points = [];
    while (z < treeHeight) {
        points.push(new THREE.Vector3(x, y, z));
        unity = Math.random() > .5 ? 1 : -1;
        x += (unity * Math.random() * spread * (z / treeHeight));
        unity = Math.random() > .5 ? 1 : -1;
        y += (unity * Math.random() * spread * (z / treeHeight));
        z += zStep;
    }

    // add segments for debugging
    let i=0;
    while (i+1 < points.length) {
        let normalCurve = new THREE.LineCurve3( points[i], points[i+1]);
        i++;

        let geometry = new THREE.TubeGeometry( normalCurve, 20, 2, 8, false );
        let material = new THREE.MeshBasicMaterial( { color: 0xFFff00 } );
        let normalMesh = new THREE.Mesh( geometry, material );
        normalMesh.position.x = points[i].x;
        normalMesh.position.y = points[i].y;
        normalMesh.position.z = points[i].z;

        scene.add( normalMesh );

        let sphGeometry = new THREE.SphereGeometry( 50,32,32 );

        sphGeometry.position = points[i]

        let sphMaterial = new THREE.MeshBasicMaterial( {color: 0xff0000} );
        let sphere = new THREE.Mesh( sphGeometry, sphMaterial );
        sphere.position.x = points[i].x;
        scene.add( sphere );


    }


    return createCurveFromPoints(points);
}

function createCurveFromPoints(curve) {
    return new THREE.CatmullRomCurve3(curve); //, false, 'chordal', 0.5);
}


function createTree() {

    const MAX_TREE_SIZE = 120;
    const WANDER = 250;
    const Z_STEP = .5;
    const NUM_BRANCHES = 1;

    //let material = new THREE.MeshPhongMaterial({color: values.tubes.static.color, specular: 0xffffff});
    let material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5
    });


    let treeGroup = new THREE.Group();
    treeGroup.name = 'tubeGroup';

    let branches = [];
    let branch;
    while (branches.length < NUM_BRANCHES) {
        branch = createBranch(MAX_TREE_SIZE, WANDER, Z_STEP, branch);
        branches.push(branch);

        // treeGroup.add(new THREE.Mesh(
        //     new THREE.TubeGeometry(branch, points.length, 150, 25, false),
        //     material
        // ));

        let branchGeometry = new THREE.BufferGeometry().setFromPoints(branch.getPoints(200));
        treeGroup.add(new THREE.Line(branchGeometry, material));

        // treeGroup.add(new THREE.Mesh(
        //     new THREE.BufferGeometry.setFromPoints(branch.getPoints()) //(branch, points.length, 150, 25, false),
        //     material
        // ));

    }

    scene.add(treeGroup);

}

function updateScene() {
    //updateGeometries();
    //updateLighting();
    //updateCamera();
    //processFadeouts();
}

