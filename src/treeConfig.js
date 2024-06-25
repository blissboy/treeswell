const drawing = {
    FRAMERATE: 1,
    BG_COLOR: 0x000000,
    FADING_STEPS: 100,
};
const tree = {
    MAX_TREE_HEIGHT: 63000,
    SPREAD: 3000,
    Z_STEP: 300,
    STUMP_HEIGHT: 8000,
    branches: [
        {
            NUM_POINTS_ON_BRANCH: 1500,
            START_COLOR: 0x63ff20,
            MID_COLOR: 0x394510,
            FINAL_COLOR: 0xD57500,
            FADING_STEPS: 100,
            START_OPACITY: 0.0,
            FINAL_OPACITY: 1.0,
            SPLIT_ANGLE: (30 * Math.PI) / 180,
            TUBE_RADIUS: 50,
        }
    ],
}
const camera = {
    position: {
        x: 63000 * .29,
        y: 63000 * .63,
        z: 63000 * .25,
    },
    lookAt: {
        x: 0,
        y: 63000 / 2,
        z: 63000,
    },
    maxAzimuthAngle: Math.PI / 2,
    maxPolarAngle: Math.PI / 2,
    target: {
        x: -2722,
        y: 32248,
        z: -4674,
    },
};
const lights = 
    [
        {
            color: 0xffffff,
            intensity: 1,
            distance: 0,
        },
        {
            color: 0xffffff,
            intensity: 1,
            distance: 0,
        },
        {
            color: 0xffffff,
            intensity: 1,
            distance: 0,
        },
        {
            color: 0xffffff,
            intensity: 1,
            distance: 0,
        },
        {
            color: 0xffffff,
            intensity: 1,
            distance: 0,
        },
    ];

const config = {
    drawing: drawing,
    tree: tree,
    camera: camera,
    lights: [
        {
            color: 0xffffff,
            intensity: 1,
            distance: 0,
        },
        {
            color: 0xffffff,
            intensity: 1,
            distance: 0,
        },
        {
            color: 0xffffff,
            intensity: 1,
            distance: 0,
        },
        {
            color: 0xffffff,
            intensity: 1,
            distance: 0,
        },
        {
            color: 0xffffff,
            intensity: 1,
            distance: 0,
        },
    ],
};