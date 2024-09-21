import { _decorator, Component, Contact2DType, IPhysics2DContact, Vec2, tween, RigidBody2D, Vec3, Node, CircleCollider2D } from 'cc';
import { CarController } from './CarController';

const { ccclass, property } = _decorator;

@ccclass('CarCollisionHandler')
export class CarCollisionHandler extends Component {
    private carColliders: CircleCollider2D[] = [];

    public getCarColliders(): CircleCollider2D[] {
        return this.carColliders;
    }

    @property
    pushBackForce: number = 150;

    @property
    stunDuration: number = 1;

    private carController: CarController = null!;

    start() {

        this.carController = this.getComponent(CarController)!;
        this.carColliders = this.getComponents(CircleCollider2D);
        this.enableCollisionListeners();
    }

    onEnable() {
        this.enableCollisionListeners();
    }

    onDisable() {
        this.disableCollisionListeners();
    }

    private enableCollisionListeners() {
        this.carColliders.forEach(collider => {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        });
    }

    private disableCollisionListeners() {
        this.carColliders.forEach(collider => {
            collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        });
    }

    onBeginContact(selfCollider: CircleCollider2D, otherCollider: CircleCollider2D, contact: IPhysics2DContact | null) {
        console.log("onBeginContact called", selfCollider, otherCollider);
        if (otherCollider.node.getComponent(CarController)) {
            // Calculate push back direction
            const pushDirection = otherCollider.node.worldPosition.subtract(selfCollider.node.worldPosition).normalize();
            const pushDistance = pushDirection.multiplyScalar(this.pushBackForce); // Adjust distance based on force

            let secondSelfCollider: CircleCollider2D = this.carColliders.find(collider => collider !== selfCollider)!;
            let otherCarHandler = otherCollider.node.getComponent(CarCollisionHandler);
            let secondOtherCollider: CircleCollider2D = otherCarHandler?.getCarColliders().find(collider => collider !== otherCollider);
            // Push back both cars using Tween
            this.pushBackCar(selfCollider.node, pushDistance);
            this.pushBackCar(otherCollider.node, pushDistance.negative());

            // Stun both cars
            this.stunCar(this.carController);
            this.stunCar(otherCollider.node.getComponent(CarController)!);
        }
    }

    private pushBackCar(carNode: Node, pushDistance: Vec3) {
        const startPos = carNode.position.clone();
        const endPos = startPos.add(pushDistance);

        tween(carNode)
            .to(0.5, { position: endPos }, { easing: 'quadOut' })
            .start();
    }

    private stunCar(carController: CarController) {
        carController.setStunned(true);
        this.scheduleOnce(() => {
            carController.setStunned(false);
        }, this.stunDuration);
    }
}