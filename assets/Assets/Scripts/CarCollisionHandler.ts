import { _decorator, Component, Collider2D, Contact2DType, IPhysics2DContact, Vec2, tween } from 'cc';
import { CarController } from './CarController';

const { ccclass, property } = _decorator;

@ccclass('CarCollisionHandler')
export class CarCollisionHandler extends Component {
    @property(Collider2D)
    carCollider: Collider2D = null!;

    @property
    pushBackForce: number = 500;

    @property
    stunDuration: number = 1;

    private carController: CarController = null!;

    start() {
        this.carController = this.getComponent(CarController)!;
        this.carCollider.on(Contact2DType.BEGIN_CONTACT, this.onCollision, this);
    }

    onCollision(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if (otherCollider.node.getComponent(CarController)) {
            // Calculate push back direction
            const pushDirection = selfCollider.node.worldPosition.subtract(otherCollider.node.worldPosition).normalize();
            const pushForce = pushDirection.multiplyScalar(this.pushBackForce);

            // Apply push back force
            const rigidBody = this.carController.getComponent(Collider2D)!.body!;
            const pushForce2D = new Vec2(pushForce.x, pushForce.y);
            let worldCenter = Vec2.ZERO;
            rigidBody.getWorldCenter(worldCenter);
            rigidBody.applyForce(pushForce2D, worldCenter, true);


            // Stun the car


            this.carController.setStunned(true);
            this.scheduleOnce(() => {
                this.carController.setStunned(false);
            }, this.stunDuration);
        }
    }
}