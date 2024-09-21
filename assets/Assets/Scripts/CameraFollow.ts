import { _decorator, Component, Node, Vec3, Camera, CCFloat, Vec2 } from 'cc';
import { CarController } from './CarController';
import { GameManager } from './GameManager'; // Add this import
const { ccclass, property, executionOrder} = _decorator;

@ccclass('FollowPlayer')
@executionOrder(2)
export class CameraFollow extends Component {
    @property(Node)
    playerCar: Node | null = null;

    @property(Node)
    mainCamera: Node | null = null;

    @property(Vec3)
    cameraOffset: Vec3 = new Vec3(0, 0, 0);

    @property(CCFloat)
    cameraSmoothing: number = 0.1;

    @property(Vec2)
    backgroundSize: Vec2 = new Vec2(0, 0);
    start() {
        this.initializeCamera();

        this.playerCar = GameManager.instance.playerCarController.node;
    }


    private initializeCamera() {
        if (!this.mainCamera) {
            this.mainCamera = this.node.getComponent(Camera)?.node || null;
        }
    }


    update(deltaTime: number) {
        this.updateCameraPosition(deltaTime);
    }

    private updateCameraPosition(deltaTime: number) {
        if (!this.playerCar || !this.mainCamera) return;

        const targetPosition = this.playerCar.worldPosition.clone().add(this.cameraOffset);
        if (this.backgroundSize > Vec2.ZERO) {
            if (targetPosition.x < -this.backgroundSize.x / 2 && targetPosition.x > this.backgroundSize.x / 2) {
                return;
            }
            if (targetPosition.y < -this.backgroundSize.y / 2 && targetPosition.y > this.backgroundSize.y / 2) {
                return;
            }
        }
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


