// declare module 'three-orbit-controls' {
//     import { Camera, EventDispatcher, MOUSE, Object3D, Vector3 } from 'three';

//     class OrbitControls extends EventDispatcher {
//         constructor(object: Camera, domElement?: HTMLElement);

//         object: Camera;
//         domElement: HTMLElement | undefined;

//         // API
//         enabled: boolean;
//         target: Vector3;

//         // deprecated
//         center: Vector3;

//         // methods
//         update(): void;
//         dispose(): void;

//         // EventDispatcher mixins
//         addEventListener(type: string, listener: (event: any) => void): void;
//         hasEventListener(type: string, listener: (event: any) => void): boolean;
//         removeEventListener(type: string, listener: (event: any) => void): void;
//         dispatchEvent(event: { type: string; [attachment: string]: any }): void;
//     }

//     export default function (three: typeof import('three')): typeof OrbitControls;
// }