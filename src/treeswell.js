"use strict";

const ambient_light_name = 'ambientLight';
var scene, camera, renderer, cameraControls;
var renderCount = 0;
var gui;

var mesh;

//var parentTubeFolder;

var oscillators;
var dynamicValues = new Map();
var fadeOuts = new Map();

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

    // mesh.add( new THREE.LineSegments(
    //
    //     new THREE.Geometry(),
    //
    //     new THREE.LineBasicMaterial( {
    //         color: 0xffffff,
    //         transparent: true,
    //         opacity: 0.5
    //     } )
    //
    // ) );
    //
    // mesh.add( new THREE.Mesh(
    //
    //     new THREE.Geometry(),
    //
    //     new THREE.MeshPhongMaterial( {
    //         color: 0x156289,
    //         emissive: 0x072534,
    //         side: THREE.DoubleSide,
    //         flatShading: true
    //     } )
    //
    // ) );
    //
    // //var options = chooseFromHash( mesh );
    //
    // scene.add( mesh );

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


function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    renderer = new THREE.WebGLRenderer({antialias: true});
    cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
    cameraControls.addEventListener('change', function () {
        renderer.render(scene, camera);
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    document.body.appendChild(renderer.domElement);

    createTree();


    //createOscillators();
    //createGUI();
    createScene();
}

function getOscilatorTypes() {
    return new Map(values.oscillatorTypes.map((osc) => [osc.name, osc]));
}

function createTree() {

    const MAX_TREE_SIZE = 120;
    const WANDER = 2050;
    const Z_STEP = .5;
    const NUM_BRANCHES = 90;

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
        let x = 0, y = 0, z = 0;
        let points = [];
        while (z < MAX_TREE_SIZE) {
            points.push(new THREE.Vector3(x, y, z));
            x += (Math.random() * WANDER * (z / MAX_TREE_SIZE));
            y += (Math.random() * WANDER * (z / MAX_TREE_SIZE));
            z += Z_STEP;
        }

        branch = createCurveFromPoints(points);
        branches.push(branch);

        treeGroup.add(new THREE.Mesh(
            new THREE.TubeGeometry(branch, branch.length, 150, 25, false),
            material
        ));

    }

    scene.add(treeGroup);

}

function getUniqueGroupName(name) {
    let uniqueifier = 1;
    let usedName = name;
    while (scene.getObjectByName(usedName)) {
        uniqueifier++;
        usedName = name + uniqueifier;
    }
    return usedName;
}

function createFadeOut(theName) {
    return {
        name: theName,
        count: 30,
        timesCalled: 0,
        fade: (me) => {
            if (me.timesCalled++ > me.count) {
                //scene.removeChild(me.name);
                let meObject = scene.getObjectByName(me.name);
                if (meObject) {
                    scene.remove(meObject);
                }
                fadeOuts.delete(me.name);
            }
        }
        // something that fades out the old tubeGroup, for now just nuke
    };
}


function createScene() {
    //testScope(new THREE.Vector3(100,0,0));
    setupLighting();
    setupCamera();
    //createGeometries();
}

function updateScene() {
    //updateGeometries();
    updateLighting();
    updateCamera();
    //processFadeouts();
}

function createGeometries() {
    scene.add(createTubeGroup());
    scene.add(createBigBubble());
    // let ringGroup = new THREE.Group();
    // ringGroup.name = 'ringGroup';
    // createSquiggleRings(squiggleLines).forEach((ring) => {
    //     ringGroup.add(new THREE.Mesh(
    //         ring,
    //         material
    //     ));
    // });
    // scene.add(ringGroup);


    //createBubble();


}

// function createBigBubble() {
//     let bubbleGeometry = new THREE.SphereBufferGeometry(
//         values.bubble.radius,
//         values.bubble.latitudePoints,
//         values.bubble.longitudePoints);
//
//     let bubbleWireframe = new THREE.WireframeGeometry(bubbleGeometry);
//     let bubbleWireFrameLines = new THREE.LineSegments(bubbleWireframe);
//     let bubbleWireFrameMaterial = new THREE.MeshLambertMaterial({
//         depthTest: true,
//         opacity: 0.8,
//         transparent: true,
//         color: 0xaaaaaa
//     });
//     let bigBubble = new THREE.Mesh(bubbleWireframe, bubbleWireFrameMaterial);
//     bigBubble.name = 'bigBubble';
//
//     let calc = {
//         evaluate: () => {
//             bigBubble.material.color.set(
//                 `rgb(${Math.abs(Math.round(oscillators.get("sin60draw")() * 100))}%,
//                  ${Math.abs(Math.round(oscillators.get("sin30draw")() * 100))}%,
//                  ${Math.abs(Math.round(oscillators.get("sin20draw")() * 100))}%)`
//             );
//             bigBubble.rotation.x += .001;
//         }
//     }
//
//     dynamicValues.set('bigBubble.material.color', calc);
//     return bigBubble;
// }
//
//
// function createTubeGroup() {
//     let material = new THREE.MeshPhongMaterial({color: values.tubes.static.color, specular: 0xffffff});
//     let squiggleLines = createCurves();
//     let tubeGroup = new THREE.Group();
//     const wriggle_size = 2;
//     const wriggle_step = 45;
//     tubeGroup.name = 'tubeGroup';
//     createSquiggleTubes(squiggleLines).forEach((tube) => {
//         tubeGroup.add(new THREE.Mesh(
//             tube,
//             material
//         ));
//     });
//
//     let calc = {
//         evaluate: () => {
//             let wriggleX = wriggle_size * oscillators.get('sin60draw')();
//             let wriggleY = wriggle_size * oscillators.get('sin30draw')();
//             let wriggleZ = wriggle_size * oscillators.get('sin20draw')();
//             let wriggle = new THREE.Vector3(wriggleX, wriggleY, wriggleZ);
//             let wriggle1 = new THREE.Vector3(wriggleY, wriggleZ, wriggleX);
//             let wriggle2 = new THREE.Vector3(wriggleZ, wriggleX, wriggleY);
//             tubeGroup.children.forEach((tube) => {
//                 tube.geometry.vertices.forEach((pt, i) => {
//                     switch (i % wriggle_step) {
//                         case 0:
//                             pt = pt.add(wriggle);
//                             break;
//                         case 1:
//                             pt = pt.add(wriggle1);
//                             break;
//                         case 2:
//                             pt = pt.add(wriggle2);
//                             break;
//                     }
//                 });
//                 tube.geometry.verticesNeedUpdate = true;
//                 //tube.
//             });
//         }
//     }
//
//     dynamicValues.set('tubes', calc);
//
//     return tubeGroup;
// }

function createBubble() {

    let shader = THREE.FresnelShader;
    let uniforms = THREE.UniformsUtils.clone(shader.uniforms);
    uniforms["tCube"].value = getBubbleTexture();
    let material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: shader.vertexShader,
        fragmentShader: shader.fragmentShader
    });

    let bubbleGeometry = new THREE.SphereGeometry(100, 64, 32);
    let bubble = new THREE.Mesh(bubbleGeometry, material);
    bubble.name = 'bubble';
    //sphere.position.set(0, 50, 100);
    //scene.background = getBubbleTexture();
    scene.add(bubble);

    // this.refractSphereCamera = new THREE.CubeCamera( 0.1, 5000, 512 );
    // scene.add( refractSphereCamera );
    // var fShader = THREE.FresnelShader;
    //
    // var fresnelUniforms =
    //     {
    //         "mRefractionRatio": { type: "f", value: 1.02 },
    //         "mFresnelBias": 	{ type: "f", value: 0.1 },
    //         "mFresnelPower": 	{ type: "f", value: 2.0 },
    //         "mFresnelScale": 	{ type: "f", value: 1.0 },
    //         "tCube": 			{ type: "t", value: refractSphereCamera.renderTarget } //  textureCube }
    //     };
    //
    // // create custom material for the shader
    // var customMaterial = new THREE.ShaderMaterial(
    //     {
    //         uniforms: 		fresnelUniforms,
    //         vertexShader:   fShader.vertexShader,
    //         fragmentShader: fShader.fragmentShader
    //     }   );
    //
    // var sphereGeometry = new THREE.SphereGeometry( 100, 64, 32 );
    // this.sphere = new THREE.Mesh( sphereGeometry, customMaterial );
    // sphere.position.set(0, 50, 100);
    // scene.add(sphere);
    //
    // refractSphereCamera.position = sphere.position;

}

function getBubbleTexture() {
    let textureImage = 'images/RedSquare_Tuthill_1024.jpg';
    let urls = Array(6).fill(textureImage);
    let textureCube = new THREE.CubeTextureLoader().load(urls);
    textureCube.format = THREE.RGBFormat;

    return textureCube;
}


function updateGeometries() {

    // if ( renderCount > 100) {
    //     let oscFn = oscillators.get('sin60draw');
    //     console.log(oscFn);
    //     let woo = oscFn();
    //     console.log(woo);
    // }

    let rotX = 0.001;
    let stepX = 0.0001;
    let rotY = 0.001;
    let stepY = 0.0001;
    let rotZ = 0.003;
    scene.children.filter((c) => c.name != 'lights').forEach(c => {
        c.rotation.x += rotX;
        c.rotation.y += rotY;
        rotX += stepX;
        rotY += stepY;
    });

    dynamicValues.forEach((dv) => dv.evaluate());

}

function setupLighting() {
    let lights = new THREE.Group();
    lights.name = 'lights';
    values.lights.pointLights.forEach((light) => {
        let lite = new THREE.PointLight(light.color, light.intensity);
        lite.position.set(light.position.x, light.position.y, light.position.z);
        lite.name = light.name;
        lights.add(lite);
    });

    let ambientLite = new THREE.AmbientLight(
        values.lights.ambientLight.color,
        values.lights.ambientLight.intensity);
    ambientLite.name = ambient_light_name;
    lights.add(ambientLite);

    scene.add(lights);
}

function updateLighting() {
}

// function setupCamera() {
//     camera.position.z = 900;
//     camera.position.x = 200;
//     camera.position.y = -12;
//     cameraControls.target = new THREE.Vector3(0, 0, 0);
//     cameraControls.update();
// }

function updateCamera() {
}

function processFadeouts() {
    fadeOuts.forEach((value, key, map) => {
        value.fade(value);
    })
}

/**
 * Create a walk across a region.
 *
 * @param startingPoint the point from which to start the walk
 * @param isPointStillInRegion a function that determines if the walk is still within the region. For example,
 * could pass a function like the following to determine if the point was outside the drawing window:
 *  (currentPointOfWalk) => {
 *      if ( currentPointOfWalk.x > window.innerWidth
 *          || currentPointOfWalk.x < 0
 *          || currentPointOfWalk.y > window.innerHeight
 *          || currentPointOfWalk.y < 0 ) {
 *          return false;
 *      } else {
 *          return true;
 *      }
 * }
 * @param startingDirection a Vector3 indicating the direction that the path is facing at the start of the process
 * @param calculateNextStep function that will calculate the next step given the current location, direction,
 * and array of steps as an input.
 *
 * @returns an array of steps (in the form {x,y,z}) indicating the steps.
 */
function getPointsAcrossRegion(startingPoint,
                               startingDirection, //Vector3
                               isPointStillInRegion,
                               calculateNextStep = (location, direction, steps) => {
                                   return (new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)).normalize();
                               }) {

    let steps = [];
    let currentPoint = startingPoint.clone();
    let currentDirection = startingDirection.clone();
    currentPoint.add(currentDirection);
    steps.push(currentPoint.clone());
    do {
        let nextStep = calculateNextStep(currentPoint, currentDirection, steps);
        currentPoint.add(nextStep.clone());
        currentPoint.add(currentDirection);
        steps.push(currentPoint.clone());
    }
    while (isPointStillInRegion(currentPoint));

    // console.log('***************************')
    // console.log('starting point ' + vec3ToString(startingPoint));
    // console.log('starting direction ' + vec3ToString(startingDirection));
    // console.log('Points:');
    // steps.forEach((pt) => { console.log(`\t ${vec3ToString(pt)}`) });

    return steps;
}

function createCurveFromPoints(points) {
    return new THREE.CatmullRomCurve3(points, false, 'chordal', 0.5);
}

function createTorusFromPoints(points) {
    return new THREE.CatmullRomCurve3(points);
}


/**
 * create paths across the bubble
 *
 * @returns array of Curves
 */
function createCurves() {
    let phi, theta, normal, x, y, z, pt, steps;
    const twoPI = Math.PI * 2.0;
    let curves = [];

    for (let i = 0; i < values.bubble.longitudePoints; i++) {
        for (let j = 0; j < values.bubble.latitudePoints; j++) {
            // get surface normal
            theta = twoPI / i;
            phi = twoPI / j;
            x = values.bubble.radius * Math.sin(theta) * Math.cos(phi);
            y = values.bubble.radius * Math.sin(theta) * Math.sin(phi);
            z = values.bubble.radius * Math.cos(theta);
            pt = new THREE.Vector3(x, y, z);
            normal = new THREE.Vector3(x, y, z).normalize().multiplyScalar(-1);
            steps = getPointsAcrossRegion(new THREE.Vector3(x, y, z), normal, (point) => point.length() < values.bubble.radius);
            if (steps.length > 1) {
                curves.push(createCurveFromPoints(steps));
            }
        }
    }
    return curves;
}

function vec3ToString(vec) {
    return (`${vec.x},${vec.y},${vec.z}`);
}

