import {
    AxesHelper,
    DirectionalLight,
    HemisphereLight,
    PerspectiveCamera,
    Scene,
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
            75, 512 / 334, 0.1, 1000
        );
        this.camera.position.x = 0;
        this.camera.position.y = 100;
        this.camera.position.z = 0;

        this.scene.add(this.camera);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        const axis = new AxesHelper(200);
        this.scene.add(axis);

        const hemiLight = new HemisphereLight(0xffffff, 0xffffff, 0.002);
        hemiLight.color.setHSL(0.6, 0.75, 0.5);
        hemiLight.groundColor.setHSL(0.095, 0.5, 0.5);
        hemiLight.position.set(0, 500, 0);
        this.scene.add(hemiLight);

        const light = new DirectionalLight(0xffffff, 0.002);
        // light.color.setHSL(0.6, 0.75, 0.5);
        light.position.set( -1, 0.75, 1 );

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

        this.sceneCreated = true;
    }
}

export const game = new Game();
