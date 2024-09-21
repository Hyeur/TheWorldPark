import { _decorator, Component, Node, Vec3, Camera, CCFloat } from 'cc';
import { CarController } from './CarController';
import { GameManager } from './GameManager'; // Add this import
const { ccclass, property } = _decorator;

@ccclass('FollowPlayer')
export class CameraFollow extends Component {
    @property(Node)
    playerCar: Node | null = null;

    @property(Node)
    mainCamera: Node | null = null;

    @property(Vec3)
    cameraOffset: Vec3 = new Vec3(0, 0, 0);

    @property(CCFloat)
    cameraSmoothing: number = 0.1;

    start() {
        this.initializeCamera();
        this.findPlayerCar();
    }

    private initializeCamera() {
        if (!this.mainCamera) {
            this.mainCamera = this.node.getComponent(Camera)?.node || null;
        }
    }

    private findPlayerCar() {
        if (!this.playerCar) {
            const playerController = GameManager.instance.playerCarController;
            if (playerController) {
                this.playerCar = playerController.node;
                console.log("Local player car found and set as target for camera.");
            } else {
                console.warn("No local player car found in the scene.");
            }
        }
    }

    update(deltaTime: number) {
        this.updateCameraPosition(deltaTime);
    }

    private updateCameraPosition(deltaTime: number) {
        if (!this.playerCar || !this.mainCamera) return;

        const targetPosition = this.playerCar.worldPosition.clone().add(this.cameraOffset);
        const newPosition = new Vec3(
            this.lerp(this.mainCamera.worldPosition.x, targetPosition.x, this.cameraSmoothing),
            this.lerp(this.mainCamera.worldPosition.y, targetPosition.y, this.cameraSmoothing),
            this.mainCamera.worldPosition.z
        );

        this.mainCamera.setWorldPosition(newPosition);
    }

    private lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }
}


