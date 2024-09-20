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
        if (!this.mainCamera) {
            this.mainCamera = this.node.getComponent(Camera).node;
        }
        
        if (!this.playerCar) {
            let outCarController: CarController | null = null;
            const haveLocalPlayerCar = GameManager.instance.findLocalPlayerCar(outCarController);
            
            if (haveLocalPlayerCar) {
                this.playerCar = outCarController.node;
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
        const cameraNode = this.mainCamera;

        const newPosition = new Vec3(
            this.lerp(cameraNode.worldPosition.x, targetPosition.x, this.cameraSmoothing),
            this.lerp(cameraNode.worldPosition.y, targetPosition.y, this.cameraSmoothing),
            cameraNode.worldPosition.z
        );

        cameraNode.setWorldPosition(newPosition);
    }

    private lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }
}


