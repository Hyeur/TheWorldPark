import { _decorator, Component, Node, Vec3, Camera, CCFloat, Vec2 } from 'cc';
import { GameManager } from './GameManager';

const { ccclass, property, executionOrder } = _decorator;

@ccclass('CameraFollow')
@executionOrder(2)
export class CameraFollow extends Component {
    @property(Vec3) cameraOffset = new Vec3();
    @property(CCFloat) cameraSmoothing = 0.1;
    @property(Vec2) xLimit = new Vec2();
    @property(Vec2) yLimit = new Vec2();

    private mainCamera: Node | null = null;
    private playerCar: Node | null = null;

    start() {
        this.initializeCamera();
        this.playerCar = GameManager.instance.playerCarController.node;
    }

    update(deltaTime: number) {
        this.updateCameraPosition();
    }

    private initializeCamera() {
        this.mainCamera = this.getComponent(Camera)?.node || null;
    }

    private updateCameraPosition() {
        if (!this.playerCar || !this.mainCamera) return;

        const targetPosition = this.playerCar.position.clone().add(this.cameraOffset);
        const clampedPosition = this.clampToBounds(targetPosition);

        const newPosition = new Vec3(
            this.lerp(this.mainCamera.position.x, clampedPosition.x, this.cameraSmoothing),
            this.lerp(this.mainCamera.position.y, clampedPosition.y, this.cameraSmoothing),
            this.mainCamera.position.z
        );

        this.mainCamera.setPosition(newPosition);
    }

    private clampToBounds(position: Vec3): Vec3 {
        const clampedX = Math.max(this.xLimit.x, Math.min(this.xLimit.y, position.x));
        const clampedY = Math.max(this.yLimit.x, Math.min(this.yLimit.y, position.y));
        
        return new Vec3(clampedX, clampedY, position.z);
    }

    private lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }
}


