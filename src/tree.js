const THREE = require('THREE');
const TreeModel = require('tree-model');

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
const START_OPACITY = 0.0;
const FINAL_OPACITY = 1.0;
const SPLIT_ANGLE = (30 * Math.PI) / 180;
const STUMP_HEIGHT = 8000;
const TUBE_RADIUS = 50;

let nextTreeNodeId = 0;
let branchNumber = 0;
let tree;

function shouldKeepGoing(branchNodesToSplit) {
    let pointsRet = branchNodesToSplit.filter((branch) => {
        let aboveZ = branch.model.points.filter((point) => {
            return point && point.z && point.z > MAX_TREE_HEIGHT;
        });
        return !aboveZ.length;
    });
    return !pointsRet.length;
}

function createTree(treeHeight, spread, yStep) {
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
}

function getBranchEndInfo(branch) {
    return {
        location: branch.model.points[branch.model.points.length - 1],
        normal: new THREE.Vector3().subVectors(branch.model.points[branch.model.points.length - 1], branch.model.points[branch.model.points.length - 2]).normalize()
    };
}

function getNewBranchStarts(branch) {
    let splitPoint = getBranchEndInfo(branch);
    let sphCoordOfNormalEnd = new THREE.Spherical().setFromVector3(new THREE.Vector3(
        splitPoint.location.x + splitPoint.normal.x,
        splitPoint.location.y + splitPoint.normal.y,
        splitPoint.location.z + splitPoint.normal.z)
    );

    let newStarts = [];
    newStarts.push(getNewStart(branch.location, sphCoordOfNormalEnd, SPLIT_ANGLE, SPLIT_ANGLE));
    newStarts.push(getNewStart(branch.location, sphCoordOfNormalEnd, -1.0 * SPLIT_ANGLE, SPLIT_ANGLE));
    newStarts.push(getNewStart(branch.location, sphCoordOfNormalEnd, SPLIT_ANGLE, -1.0 * SPLIT_ANGLE));
    newStarts.push(getNewStart(branch.location, sphCoordOfNormalEnd, -1.0 * SPLIT_ANGLE, -1.0 * SPLIT_ANGLE));

    return newStarts;
}

function getNewStart(startPoint, sphCoordOfNormalEnd, phiChange, thetaChange) {
    return {
        location: startPoint,
        normal: new THREE.Vector3().setFromSpherical(new THREE.Spherical(
            sphCoordOfNormalEnd.radius,
            sphCoordOfNormalEnd.phi + phiChange,
            sphCoordOfNormalEnd.theta + thetaChange))
    };
}

function addForkBranchesToNodes(branchesToSplit) {
    let newBranches = [];
    branchesToSplit.forEach(branch => {
        getNewBranchStarts(branch).forEach((branchStart) => {
            newBranches.push(createBranch(branchStart, branch));
        });
    });
    return newBranches;
}

function createBranch(branchStart, branchThisComesFrom) {
    let branchNode = tree.parse({
        name: nextTreeNodeId++,
        points: [
            branchStart.location,
            branchStart.location + (branchStart.normal.multiplyScalar(Math.random() * 1000))
        ]
    });

    if (branchThisComesFrom && branchThisComesFrom.addChild) {
        branchThisComesFrom.addChild(branchNode);
    }

    return branchNode;
}

function createBranchCurve(treeHeight, spread, yStep) {
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
        name: 'branch' + branchNumber++
    };
}

function createCurveFromPoints(curve) {
    return new THREE.CatmullRomCurve3(curve);
}

function freshenBranches(branchGroup) {
    if (branchGroup.children.length < NUM_BRANCHES) {
        let newBranch = createBranchCurve(MAX_TREE_HEIGHT, SPREAD, Z_STEP);
        branchGroup.add(new THREE.Mesh(
            new THREE.TubeBufferGeometry(newBranch.curve, NUM_POINTS_ON_BRANCH, TUBE_RADIUS, 16, false),
            newBranchMaterial())
        );
    }
}

function newFadingBranch(branch, fadingGroup) {
    branch.material = newFadingMaterial();
    fadingGroup.add(branch);
}

function pruneBranches(branchGroup, fadingGroup) {
    updateGrowingBranches(branchGroup, fadingGroup);
    updateFadingBranches(fadingGroup);
}

function updateGrowingBranches(branchGroup, fadingGroup) {
    updateBranchGroupMaterial(
        branchGroup,
        (mesh, index) => {
            let material = mesh.material;
            material.opacity = doubleCircleSigmoid(material.userData.frames.map(0, GROWTH_STEPS, 0.0, 1.0), .63);
            material.color.r = (material.userData.frames.map(0, GROWTH_STEPS, START_COLOR.r, MID_COLOR.r));
            material.color.g = (material.userData.frames.map(0, GROWTH_STEPS, START_COLOR.g, MID_COLOR.g));
            material.color.b = (material.userData.frames.map(0, GROWTH_STEPS, START_COLOR.b, MID_COLOR.b));
            material.userData.frames++;
            if (material.userData.frames > GROWTH_STEPS) {
                newFadingBranch(mesh, fadingGroup);
                branchGroup.remove(mesh);
            }
        }
    );
}

function updateFadingBranches(fadingGroup) {
    updateBranchGroupMaterial(
        fadingGroup,
        (mesh, index) => {
            let material = mesh.material;
            material.opacity = doubleCircleSigmoid(material.userData.frames.map(0, FADING_STEPS, 1.0, 0.0), .63);
            material.color.r = (material.userData.frames.map(0, FADING_STEPS, MID_COLOR.r, FINAL_COLOR.r));
            material.color.g = (material.userData.frames.map(0, FADING_STEPS, MID_COLOR.g, FINAL_COLOR.g));
            material.color.b = (material.userData.frames.map(0, FADING_STEPS, MID_COLOR.b, FINAL_COLOR.b));
            material.userData.frames++;
            if (material.userData.frames > FADING_STEPS) {
                fadingGroup.remove(mesh);
            }
        }
    );
}

function updateBranchGroupMaterial(branchGroup, updateFunction) {
    branchGroup.children.forEach((mesh, index) => {
        updateFunction(mesh, index);
    });
}

function doubleCircleSigmoid(x, k) {
    return (1.0 / (1.0 + Math.exp(-k * (x - 0.5))));
}

function newBranchMaterial() {
    return new THREE.MeshBasicMaterial({
        color: START_COLOR,
        transparent: true,
        opacity: START_OPACITY,
        userData: { frames: 0 }
    });
}

function newFadingMaterial() {
    return new THREE.MeshBasicMaterial({
        color: MID_COLOR,
        transparent: true,
        opacity: FINAL_OPACITY,
        userData: { frames: 0 }
    });
}

module.exports = {
    createTree,
    freshenBranches,
    pruneBranches
};
