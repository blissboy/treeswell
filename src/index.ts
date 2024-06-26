"use strict";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import TreeModel, {Node} from 'tree-model';
import * as dat from 'dat.gui';


// import {
//     Material,
//     Vector3,
//     Color,
//     Group,
//     Scene,
//     PerspectiveCamera,
//     WebGLRenderer,
//     PointLight,
//     Mesh,
//     TubeGeometry,
//     CatmullRomCurve3,
//     Spherical,
//     MeshBasicMaterial,
//     Object3D, MeshPhongMaterial, DoubleSide
// } from 'three';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
// import {LocationAndNormal, MaterialUpdateFunction} from "./types/types";

const NUM_BRANCHES = 10;
const GROWTH_STEPS = 200;
const FADING_STEPS = 600;
const MAX_TREE_HEIGHT = 63000;
const NUM_POINTS_ON_BRANCH = 1500;
const SPREAD = 3000;
const Z_STEP = 300;
const START_COLOR = new THREE.Color(0x63ff20);
const MID_COLOR = new THREE.Color(0x394510);
const FINAL_COLOR = new THREE.Color(0xD57500);
const FRAMERATE = 1;
const SPLIT_ANGLE = (30 * Math.PI) / 180;
const STUMP_HEIGHT = 8000;


const TUBE_RADIUS = 50;

var nextTreeNodeId = 0;

var branchNumber = 0;
let branchGroup: THREE.Group;
let fadingGroup: THREE.Group;
var rotate = false;

let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
let cameraControls: { update: () => void; maxAzimuthAngle: number; maxPolarAngle: number; target: THREE.Vector3; autoRotate: boolean; };


let framecount = 0;
let tree: TreeModel;
let gui: dat.GUI;

// @ts-ignore
Number.prototype.map = function (in_min: number, in_max: number, out_min: number, out_max: number) {
    // @ts-ignore
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

export type LocationAndNormal = {
    location: THREE.Vector3,
    normal: THREE.Vector3
};

export type MaterialUpdateFunction = (mesh: THREE.Mesh, index: number) => void;
console.log('powpows')
newInit();
animate();


function animate(): void {
    requestAnimationFrame(animate);
    updateScene();
    cameraControls.update();
    renderer.render(scene, camera);
}

function newInit(): void {
    gui = new dat.GUI();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(280, window.innerWidth / window.innerHeight, 0.1, 100000);
    camera.position.x = MAX_TREE_HEIGHT * .29;
    camera.position.y = MAX_TREE_HEIGHT * .63;
    camera.position.z = MAX_TREE_HEIGHT * .25;

    camera.lookAt(0, MAX_TREE_HEIGHT / 2, MAX_TREE_HEIGHT);

    renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xffffff, 1);
    document.body.appendChild(renderer.domElement);


    cameraControls = new OrbitControls(camera, renderer.domElement);
    cameraControls.maxAzimuthAngle = Math.PI / 2;
    cameraControls.maxPolarAngle = Math.PI / 2;
    //cameraControls.target = new THREE.Vector3(-2722, 32248, -4674);
    cameraControls.target = new THREE.Vector3(0, 0, 0);
    cameraControls.update();

    //orbit.enableZoom = false;

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

    console.log('new branchgroup');
    branchGroup = new THREE.Group();
    scene.add(branchGroup);
    console.log('create tree')
    const tree = createTree(MAX_TREE_HEIGHT, SPREAD, Z_STEP);


    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);

    window.addEventListener("keyup", function (event) {
        var imgData, imgNode;
        //Listen to 'P' key
        if (event.code == 'KeyP') {
            try {
                imgData = renderer.domElement.toDataURL();
                let image = new Image();
                image.src = imgData;
                let w = window.open("data:image/jpg;base64," + imgData);
                if (w) {
                    w.document.write(image.outerHTML);
                } else {
                    console.log("Browser does not support taking screenshot of 3d context");
                }
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

function shouldKeepGoing(branchNodesToSplit: Node<any>[]): boolean {
    let pointsRet = branchNodesToSplit.filter((branch) => {
        //console.log(branch.model.points);
        let aboveZ = branch.model.points.filter((point: THREE.Vector3) => {
            //console.log(point);
            return point && point.z && point.z > MAX_TREE_HEIGHT;
        });
        return !aboveZ.length;
    });
    return !pointsRet.length;
}

function createTree(treeHeight: number, spread: number, yStep: number): TreeModel {  // TODO: should this return a tree model?
    // start from zero (root node)

    tree = new TreeModel();
    let trunkNode = tree.parse({
        name: nextTreeNodeId++,
        points: [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, STUMP_HEIGHT, 0)]
    });

    let keepGrowing = true;
    let branchNodesToSplit = [trunkNode];
    while (keepGrowing) {
        branchNodesToSplit = addForkBranchesToNodes(branchNodesToSplit);
        keepGrowing = shouldKeepGoing(branchNodesToSplit);
    }

    return tree;
    // console.log(trunkNode);
    //
    // trunkNode.walk((node) => {
    //    console.log(node);
    // });


    // THINGS to TRY:
    // create tree w/ fixed # points per branch, then create curve for each path from root to leaf of tree
    // create tree and then just connect curve through all pts
    // create tree where branches split after two pts
    // create tree w/ random walks on each branch
    // a little bit harder


    // create points. At each point, decide if we split.
    // If so, then that ends this curve, create the mesh and add,
    //       and we start two more curves (start from point w/ unit vector for direction)
    // If not, keep going.

    // on split, deviate from vector represented by last two points of branch
    // at an angle of minSplitDeviation < deviation < maxSplitDeviation


    // go up by steps, if past stump height && split function &&
}

/**
 * Returns the branch collar for the "next" branch, e.g., the branch that will be created
 * starting at the point returned.
 * @param branch
 * @returns the branch collar (point and normal)
 */
function getBranchEndInfo(branch: Node<any>): LocationAndNormal {
    // let point1 = branch.model.points[branch.model.points.length - 1];
    // let point2 = branch.model.points[branch.model.points.length - 2];
    //
    // let whatIsThis = new THREE.THREE.Vector3(point1.x - point2.x, point1.y - point2.y, point1.z - point2.z);
    // console.log(whatIsThis);
    //
    return {
        location: branch.model.points[branch.model.points.length - 1],
        normal: new THREE.Vector3().subVectors(branch.model.points[branch.model.points.length - 1], branch.model.points[branch.model.points.length - 2]).normalize()
    };
}

/**
 * Determines how a branch splits
 * @param splitPoint
 * @returns {undefined}
 */
function getNewBranchStarts(branch: TreeModel.Node<any>): LocationAndNormal[] {
    let splitPoint = getBranchEndInfo(branch);

    // this is the exact place where we decide how branches split

    // have normal and startpoint
    console.log(`Splitting from location: ${JSON.stringify(splitPoint.location)} with normal: ${JSON.stringify(splitPoint.normal)}`);

    // get spherical coords of (startpoint + normal)
    let sphCoordOfNormalEnd = new THREE.Spherical().setFromVector3(new THREE.Vector3(
        splitPoint.location.x + splitPoint.normal.x,
        splitPoint.location.y + splitPoint.normal.y,
        splitPoint.location.z + splitPoint.normal.z)
    );

    let newStarts = [];
    // add angle to pi / theta for this spherical coord
    newStarts.push(getNewStart(branch.location, sphCoordOfNormalEnd, SPLIT_ANGLE, SPLIT_ANGLE));
    newStarts.push(getNewStart(branch.location, sphCoordOfNormalEnd, -1.0 * SPLIT_ANGLE, SPLIT_ANGLE));
    newStarts.push(getNewStart(branch.location, sphCoordOfNormalEnd, SPLIT_ANGLE, -1.0 * SPLIT_ANGLE));
    newStarts.push(getNewStart(branch.location, sphCoordOfNormalEnd, -1.0 * SPLIT_ANGLE, -1.0 * SPLIT_ANGLE));

    console.log(`After splitting, new starts: ${newStarts.map(start=>JSON.stringify(start))} `);

    return newStarts;

}

function getNewStart(startPoint: THREE.Vector3, sphCoordOfNormalEnd: THREE.Spherical, phiChange: number, thetaChange: number): LocationAndNormal {
    return {
        location: startPoint,
        normal: new THREE.Vector3().setFromSpherical(new THREE.Spherical(
            sphCoordOfNormalEnd.radius,
            sphCoordOfNormalEnd.phi + phiChange,
            sphCoordOfNormalEnd.theta + thetaChange))
    };
}


function addForkBranchesToNodes(branchesToSplit: Node<any>[]): Node<any>[] {
    let newBranches: Node<any>[] = [];

    branchesToSplit.forEach(branch => {
        getNewBranchStarts(branch).forEach((branchStart) => {
            newBranches.push(createBranch(branchStart, branch));
        });
    });

    return newBranches;
}


/**
 * Creates a new branch beginning at origin, tending towards normal.
 * @param branchStart the location and normal of the start of the branch
 * @param branchThisComesFrom
 */
function createBranch(branchStart: LocationAndNormal, branchThisComesFrom: Node<any>): Node<any> {
    let branchNode = tree.parse({
        name: nextTreeNodeId++,
        points: [
            branchStart.location,
            // @ts-ignore
            branchStart.location + (branchStart.normal.multiplyScalar(Math.random() * 1000))
        ]
    });

    if (branchThisComesFrom && branchThisComesFrom.addChild) {
        branchThisComesFrom.addChild(branchNode);
    }

    return branchNode;
}


function createBranchCurve(treeHeight: number, spread: number, yStep: number): { curve: THREE.CatmullRomCurve3, name: string } {
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

function createCurveFromPoints(curve: THREE.Vector3[]): THREE.CatmullRomCurve3 {
    return new THREE.CatmullRomCurve3(curve); //, false, 'chordal', 0.5);
}

function freshenBranches(): void {
    if (branchGroup.children.length < NUM_BRANCHES) {
        let newBranch = createBranchCurve(MAX_TREE_HEIGHT, SPREAD, Z_STEP);

        branchGroup.add(new THREE.Mesh(
            new THREE.TubeGeometry(newBranch.curve, NUM_POINTS_ON_BRANCH, TUBE_RADIUS, 16, false),
            newBranchMaterial())
        );
    }
}

function newFadingBranch(branch: THREE.Mesh): void {   //TODO: should probably be renamed to "addFadingBranch"
    branch.material = newFadingMaterial();
    fadingGroup.add(branch);
}

function pruneBranches(): void {
    updateGrowingBranches();
    updateFadingBranches();
}

function updateGrowingBranches(): void {
    updateBranchGroupMaterial(
        branchGroup,
        (mesh: THREE.Mesh, index: number) => {
            let material = mesh.material as THREE.MeshBasicMaterial;
            material.opacity = doubleCircleSigmoid(material.userData.frames.map(0, GROWTH_STEPS, 0.0, 1.0), .63);
            material.color.r = (material.userData.frames.map(0, GROWTH_STEPS, START_COLOR.r, MID_COLOR.r));
            material.color.g = (material.userData.frames.map(0, GROWTH_STEPS, START_COLOR.g, MID_COLOR.g));
            material.color.b = (material.userData.frames.map(0, GROWTH_STEPS, START_COLOR.b, MID_COLOR.b));
            material.userData.frames = material.userData.frames + 1;
        }
    );
    // @ts-ignore
    branchGroup.children.filter((branch) => branch.material.userData.frames > GROWTH_STEPS).forEach((branch) => newFadingBranch(branchGroup.children.shift()));
}

function updateFadingBranches(): void {
    if (fadingGroup && fadingGroup.children) {
        let removeList: number[] = [];

        updateBranchGroupMaterial(
            fadingGroup,
            (mesh: THREE.Mesh, index: number) => {
                let material: THREE.MeshBasicMaterial = mesh.material as THREE.MeshBasicMaterial;
                material.opacity = material.userData.frames.map(0, FADING_STEPS, 1.0, 0.0);
                // @ts-ignore
                material.emissiveIntensity = material.userData.frames.map(0, FADING_STEPS, 1.0, 0.0);
                //material.opacity = 1.0;
                material.color.r = (material.userData.frames.map(0, FADING_STEPS, MID_COLOR.r, FINAL_COLOR.r));
                material.color.g = (material.userData.frames.map(0, FADING_STEPS, MID_COLOR.g, FINAL_COLOR.g));
                material.color.b = (material.userData.frames.map(0, FADING_STEPS, MID_COLOR.b, FINAL_COLOR.b));
                material.userData.frames = material.userData.frames + 1;

                if (material.userData.frames > FADING_STEPS) {
                    removeList.push(index);
                    material.dispose();
                } else if (material.userData.frames % 24 === 0) {
                    let currentGeom = mesh.geometry;
                    mesh.geometry = new THREE.TubeGeometry(
                        // @ts-ignore
                        currentGeom.parameters.path,
                        Math.trunc(material.userData.frames.map(0, FADING_STEPS, NUM_POINTS_ON_BRANCH, NUM_POINTS_ON_BRANCH / 2)),
                        material.userData.frames.map(0, FADING_STEPS, TUBE_RADIUS, 1),
                        16,
                        false);
                    currentGeom.dispose();

                }


                //mesh.scale.z = 1- (material.userData.frames / FADING_STEPS);
                //mesh.scale.y = 1 - material.userData.frames / FADING_STEPS;
                //mesh.scale.x = 1 - material.userData.frames / FADING_STEPS;


                // mesh.scale(ratio)
                // mesh.geometry.parameters.radius = (material.userData.frames.map(0, FADING_STEPS, TUBE_RADIUS * 100, 0));
                // mesh.geometry.verticesNeedUpdate = true;
            }
        );

        removeList = removeList.reverse();
        removeList.forEach((index) => {
            // @ts-ignore
            fadingGroup.children[index].material.dispose();
            // @ts-ignore
            fadingGroup.children[index].geometry.dispose();
            fadingGroup.children.splice(index, 1);
        });
    }
}

function updateBranchGroupMaterial(group: THREE.Group, materialUpdateFunction: MaterialUpdateFunction): void{
    group.children.forEach((branch: THREE.Object3D, index) => {
        materialUpdateFunction(branch as THREE.Mesh, index);
    });
}

function newFadingMaterial() {
    return new THREE.MeshPhongMaterial({
        color: MID_COLOR,
        emissive: 0x000000,
        specular: 0x111111,
        side: THREE.DoubleSide,
        flatShading: false,
        opacity: 1.0,
        transparent: true,
        userData: {
            frames: 0
        }
        // },
        // blend: CustomBlending,
        // blendEquationAlpha: MaxEquation,
        // blendSrcAlpha: ZeroFactor,
        // blendDstAlpha: DstAlphaFactor
    });
}

function newBranchMaterial() {
    return new THREE.MeshPhongMaterial({
        color: START_COLOR,
        emissive: 0x000000,
        side: THREE.DoubleSide,
        flatShading: false,
        opacity: 0.0,
        transparent: true,
        userData: {
            frames: 0
        }
    });
}

function updateScene() {
    if (framecount++ % FRAMERATE == 0) {
        freshenBranches();
        pruneBranches();
    }
    //updateGeometries();
    //updateLighting();
    //updateCamera();
    //processFadeouts();
}

function doubleCircleSigmoid(x: number, a: number): number  { // see http://www.flong.com/texts/code/shapers_circ/

    if (x <= a) {
        return a - Math.sqrt(a * a - x * x);
    } else {
        return a + Math.sqrt((1 - a) * (1 - a) - (x - 1) * (x - 1));
    }
}