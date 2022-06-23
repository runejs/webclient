import {
    AxesHelper,
    DirectionalLight,
    HemisphereLight,
    PerspectiveCamera, Raycaster,
    Scene, Vector2,
    WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


export class Game {

    sceneCreated: boolean;
    canvas: HTMLCanvasElement;
    renderer: WebGLRenderer;
    camera: PerspectiveCamera;
    controls: OrbitControls;
    scene: Scene;
    frameId: number = null;
    lightingInterval;
    raycaster = new Raycaster();
    pointer = new Vector2();

    destroy(): void {
        if (this.frameId != null) {
            cancelAnimationFrame(this.frameId);
        }

        if (this.lightingInterval) {
            clearInterval(this.lightingInterval);
        }
    }

    animateScene(): void {
        if (document.readyState !== 'loading') {
            this.render();
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                this.render();
            });
        }
        window.addEventListener('resize', () => {
            this.resize();
        });
    }

    render(): void {
        this.frameId = requestAnimationFrame(() => {
            this.render();
        });
        this.renderer.render(this.scene, this.camera);
    }

    resize(): void {
        const width = 512;
        const height = 334;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    onMouseClick(event) {
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

        const intersects = this.raycaster.intersectObjects(this.scene.children);

        for (let i = 0; i < intersects.length; i++) {
            console.log(intersects[i]);
        }
    }

    createScene(canvas: HTMLCanvasElement): void {
        if(this.sceneCreated) {
            return;
        }

        // The first step is to get the reference of the canvas element from our HTML document
        this.canvas = canvas;

        // create the WebGL renderer
        this.renderer = new WebGLRenderer({
            canvas: this.canvas,
            // alpha: true,
            // antialias: true
        });

        this.renderer.setSize(512, 334);

        // create the scene
        this.scene = new Scene();

        // create the camera
        this.camera = new PerspectiveCamera(
            75, 512 / 334, 1, 2000
        );
        this.camera.position.x = 0;
        this.camera.position.y = 50;
        this.camera.position.z = 0;
        // this.camera.up.set( 0, 1, 0);
        // this.camera.lookAt(400, 0, 400);

        this.scene.add(this.camera);

        this.raycaster.setFromCamera(this.pointer, this.camera);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        const axis = new AxesHelper(200);
        this.scene.add(axis);

        const hemiLight = new HemisphereLight(0xffffff, 0xffffff, 0.002);
        hemiLight.color.setHSL(0.6, 0.75, 0.5);
        hemiLight.groundColor.setHSL(0.095, 0.5, 0.5);
        hemiLight.position.set(0, 500, 0);
        this.scene.add(hemiLight);

        const light = new DirectionalLight(0xffffff, 0.001);
        // light.color.setHSL(0.6, 0.75, 0.5);
        light.position.set( -100, 100, 100);

        /*this.lightingInterval = setInterval(() => {
            let { y } = hemiLight.position;
            y += 5;
            if (y > 1000) {
                y = 0;
            }

            hemiLight.position.setY(y);
            this.camera.updateProjectionMatrix();
        }, 600);*/

        game.scene.add(light);

        document.body.addEventListener('mousedown', e => this.onMouseClick(e));

        this.sceneCreated = true;
    }
}

export const game = new Game();
