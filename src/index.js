"use strict";
var THREE = require('THREE');
var OrbitControls = require('three-orbit-controls')(THREE);
var dat = require("dat.gui");
const { createTree, freshenBranches, pruneBranches } = require('./tree');

const MAX_TREE_HEIGHT = 63000;
const SPREAD = 3000;
const Z_STEP = 300;
const FRAMERATE = 1;
const BG_COLOR = 0x000000;
var branchGroup;
var fadingGroup;
var rotate = false;

var scene, camera, renderer, cameraControls;
var renderCount = 0;
var gui;

var framecount = 0;

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
console.log("this is snew")
newInit();
animate();

function animate() {
    requestAnimationFrame(animate);
    updateScene();
    cameraControls.update();
    renderer.render(scene, camera);
}

function newInit() {
    gui = new dat.GUI();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000000);
    camera.position.x = MAX_TREE_HEIGHT * .29;
    camera.position.y = MAX_TREE_HEIGHT * .63;
    camera.position.z = MAX_TREE_HEIGHT * .25;

    camera.lookAt(0, MAX_TREE_HEIGHT / 2, MAX_TREE_HEIGHT);

    renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(BG_COLOR, 1);
    document.body.appendChild(renderer.domElement);

    cameraControls = new OrbitControls(camera, renderer.domElement);
    cameraControls.maxAzimuthAngle = Math.PI / 2;
    cameraControls.maxPolarAngle = Math.PI / 2;
    cameraControls.target = new THREE.Vector3(-2722, 32248, -4674);
    cameraControls.update();

    var lights = [];
    lights[0] = new THREE.PointLight(0xffffff, 1, 0);
    lights[1] = new THREE.PointLight(0xffffff, 1, 0);
    lights[2] = new THREE.PointLight(0xffffff, 1, 0);
    lights[3] = new THREE.PointLight(0xffffff, 1, 0);
    lights[4] = new THREE.PointLight(0xffffff, 1, 0);
    lights[5] = new THREE.PointLight(0xffffff, 1, 0);

    lights[0].position.set(0, MAX_TREE_HEIGHT, 0);
    lights[1].position.set(MAX_TREE_HEIGHT, 0, 0);
    lights[2].position.set(0, 0, -1 * MAX_TREE_HEIGHT);
    lights[3].position.set(0, -1 * MAX_TREE_HEIGHT, 0);
    lights[4].position.set(-1 * MAX_TREE_HEIGHT, 0, 0);
    lights[5].position.set(0, 0, -1 * MAX_TREE_HEIGHT);

    scene.add(lights[0]);
    scene.add(lights[1]);
    scene.add(lights[2]);
    scene.add(lights[3]);
    scene.add(lights[4]);
    scene.add(lights[5]);

    fadingGroup = new THREE.Group();
    fadingGroup.name = 'fadingGroup';
    scene.add(fadingGroup);

    branchGroup = new THREE.Group();
    scene.add(branchGroup);

    createTree(MAX_TREE_HEIGHT, SPREAD, Z_STEP);

    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);

    window.addEventListener("keyup", function (event) {
        var imgData, imgNode;
        if (event.code == 'KeyP') {
            try {
                imgData = renderer.domElement.toDataURL();
                let image = new Image();
                image.src = imgData;
                let w = window.open("data:image/jpg;base64," + imgData);
                w.document.write(image.outerHTML);
            } catch (e) {
                console.log("Browser does not support taking screenshot of 3d context");
                return;
            }
            imgNode = document.createElement("img");
            imgNode.src = imgData;
            document.body.append(imgNode);
        } else if (event.code == 'KeyR') {
            rotate = !rotate;
            cameraControls.autoRotate = rotate;
            cameraControls.update();
        }
    });
}

function updateScene() {
    if (framecount++ % FRAMERATE == 0) {
        freshenBranches(branchGroup);
        pruneBranches(branchGroup, fadingGroup);
    }
}

function doubleCircleSigmoid(x, a) {
    if (x <= a) {
        return a - Math.sqrt(a * a - x * x);
    } else {
        return a + Math.sqrt((1 - a) * (1 - a) - (x - 1) * (x - 1));
}
}