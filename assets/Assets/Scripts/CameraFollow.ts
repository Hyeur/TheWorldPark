import { _decorator, Component, Node, Vec3, Camera, CCFloat, Vec2 } from 'cc';
import { GameManager } from './GameManager';
import { ScreenManager } from './ScreenManager';

const { ccclass, property, executionOrder } = _decorator;

@ccclass('CameraFollow')
@executionOrder(3)
export class CameraFollow extends Component {
    @property(Vec3) cameraOffset = new Vec3();
    @property(CCFloat) cameraSmoothing = 0.1;

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
        const clampedX = Math.max(-ScreenManager.instance.battleArea.width/2, Math.min(ScreenManager.instance.battleArea.width/2, position.x));
        const clampedY = Math.max(-ScreenManager.instance.battleArea.height/2, Math.min(ScreenManager.instance.battleArea.height/2, position.y));
        
        return new Vec3(clampedX, clampedY, position.z);
    }

    private lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }
}


