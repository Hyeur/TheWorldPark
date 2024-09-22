import { _decorator, Component, Contact2DType, IPhysics2DContact, Vec2, tween, RigidBody2D, Vec3, Node, CircleCollider2D, Quat, BoxCollider2D, Collider2D, ECollider2DType } from 'cc';
import { CarController } from './CarController';
import { macro } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('CarCollisionHandler')
export class CarCollisionHandler extends Component {
    private carColliders: CircleCollider2D[] = [];

    public getCarColliders(): CircleCollider2D[] {
        return this.carColliders;
    }
    public addCarCollider(collider: CircleCollider2D) {
        this.carColliders.push(collider);
    }

    @property
    pushBackForce: number = 150;

    @property
    stunDuration: number = 1;

    @property
    collisionCooldown: number = 0.5; // Cooldown time in seconds
    @property(Node)
    private frontCar: Node = null!;
    private carController: CarController = null!;
    private rigidbody: RigidBody2D = null!;

    private lastCollisionTime: number = 0;

    private lastContactPoint: Vec2 = null;
    start() {
        this.carController = this.getComponent(CarController)!;
        this.rigidbody = this.node.getComponent(RigidBody2D)!;
        this.carColliders = this.node.getComponents(CircleCollider2D);

        // this.waitForCollidersAndEnable();
        // this.fetchCollidersFromInternalComponents();
        this.enableCollisionListeners();
    }

    private waitForCollidersAndEnable() {
        console.log("waiting for colliders");
        this.schedule(this.checkAndEnableColliders, 0.1, macro.REPEAT_FOREVER, 0);
    }

    private checkAndEnableColliders() {
        if (this.carColliders.length > 0) {
            console.log("checkAndEnableColliders called");
            this.unschedule(this.checkAndEnableColliders);
            this.castCollsionsToInternalComponents();
            this.enableCollisionListeners();
            console.log(this.node, "collision listeners enabled");
        }
    }

    onEnable() {
        this.enableCollisionListeners();
    }

    onDisable() {
        this.disableCollisionListeners();
    }

    public castCollsionsToInternalComponents() {
        this.carColliders.forEach(collider => {
            //add new collider component to node
            let newCollider = this.node.addComponent(CircleCollider2D);
            newCollider.radius = collider.radius;
            newCollider.density = collider.density;
            newCollider.friction = collider.friction;
            newCollider.restitution = collider.restitution;
            newCollider.offset = collider.offset;
            newCollider.sensor = collider.sensor;
            newCollider.enabled = collider.enabled;
        });
        this.fetchCollidersFromInternalComponents();
    }

    public fetchCollidersFromInternalComponents() {
        this.carColliders = [];
        this.carColliders = this.node.getComponents(CircleCollider2D);
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
        const currentTime = Date.now() / 1000; // Current time in seconds
        if (currentTime - this.lastCollisionTime < this.collisionCooldown) {
            return; // Exit if still in cooldown
        }
        this.lastCollisionTime = currentTime;
        if (otherCollider.node.getComponent(CarController)) {
            if (otherCollider.TYPE == ECollider2DType.CIRCLE) {
                // Stun both cars
                this.stunCar(this.carController);
                this.stunCar(otherCollider.node.getComponent(CarController)!);

                // Calculate push back direction
                const pushDirection = otherCollider.node.worldPosition.subtract(selfCollider.node.worldPosition).normalize();
                const pushDistance = pushDirection.multiplyScalar(this.pushBackForce); // Adjust distance based on force

                let otherCarHandler = otherCollider.node.getComponent(CarCollisionHandler);

                let selfCenterPoint = new Vec2(this.node.worldPosition.x, this.node.worldPosition.y);
                let otherCenterPoint = new Vec2(otherCarHandler.node.worldPosition.x, otherCarHandler.node.worldPosition.y);
                let selfPoint = selfCenterPoint.subtract(selfCollider.worldPosition).multiplyScalar(1 / 2);
                let otherPoint = otherCenterPoint.subtract(otherCollider.worldPosition).multiplyScalar(1 / 2);
                this.rigidbody.applyForce(new Vec2(-pushDistance.x, -pushDistance.y), selfPoint, true);
                otherCarHandler?.rigidbody.applyForce(new Vec2(pushDistance.x, pushDistance.y), otherPoint, true);
                console.log("onBeginContact");

            }
            else
            {
                // Stun both cars
                this.stunCar(this.carController);

            }
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
        this.carController.setStunned(true);
        this.scheduleOnce(() => {
            this.easeVelocityToZero(0.9);
            this.carController.setStunned(false);
        }, this.stunDuration);
    }

    private easeVelocityToZero(t: number = 0.1): void {
        const currentVelocity = this.rigidbody.linearVelocity;
        const targetVelocity = Vec2.ZERO;
        this.rigidbody.linearVelocity = this.calculateEasedVelocity(currentVelocity, targetVelocity, t);
    }

    private calculateEasedVelocity(current: Vec2, target: Vec2, t: number): Vec2 {
        const easeFunction = (x: number) => 1 - Math.pow(1 - x, 3);
        return new Vec2(
            current.x + (target.x - current.x) * easeFunction(t),
            current.y + (target.y - current.y) * easeFunction(t)
        );
    }

    public getLookDirection(): Vec2 {
        const direction = this.frontCar.worldPosition.subtract(this.node.worldPosition).normalize();
        return new Vec2(direction.x, direction.y);
    }
}