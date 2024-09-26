import { _decorator, Component, Contact2DType, IPhysics2DContact, Vec2, tween, RigidBody2D, Vec3, Node, CircleCollider2D, Quat, BoxCollider2D, Collider2D, ECollider2DType, CollisionEventType, ICollisionEvent } from 'cc';
import { CarController } from './CarController';
import { macro } from 'cc';
import { GameObject, GameObjectType } from './GameObject';
import { Skill, SkillManager } from './SkillManager';
import { GameManager } from './GameManager';
import { CarStat } from './CarStat';
import { ConstConfig } from './Utils/ConstConfig';

export enum CarCollisionState {
    Unknown,
    Staying
}

const { ccclass, property } = _decorator;

@ccclass('CarCollisionHandler')
export class CarCollisionHandler extends Component {
    @property
    maxCapturingInSeconds: number = 3;
    @property
    minCapturingInSeconds: number = 1;

    @property
    pushBackForce: number = 150;

    @property
    stunDuration: number = 1;

    @property
    collisionCooldown: number = 0.2;

    @property(Node)
    private frontCar: Node = null!;
    private carController: CarController = null!;
    private rigidbody: RigidBody2D = null!;

    private lastCollisionTime: number = 0;

    private lastContactPoint: Vec2 = null;

    private isCollisionStaying: Boolean = false;

    private curCollisionState: CarCollisionState = CarCollisionState.Unknown;

    private carColliders: CircleCollider2D[] = [];

    private carHitBoxCollider: BoxCollider2D = null;

    private attackingValue: number = 0;

    private _deltaTime: number = 0;

    private _capturingPointPerFrame: number = 0;

    private debugBoolean: boolean = false;

    public getCarColliders(): CircleCollider2D[] {
        return this.carColliders;
    }
    public addCarCollider(collider: CircleCollider2D) {
        this.carColliders.push(collider);
    }

    start() {
        this.carController = this.getComponent(CarController)!;
        this.rigidbody = this.node.getComponent(RigidBody2D)!;
        this.carColliders = this.node.getComponents(CircleCollider2D);
        this.carHitBoxCollider = this.node.getComponent(BoxCollider2D);

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
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContactCar, this);
            collider.on(Contact2DType.END_CONTACT, this.onEndContactCar, this);
            // collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContactBound, this);
        });
        this.carHitBoxCollider.on(Contact2DType.BEGIN_CONTACT, this.onBeginAttackingContactCar, this);
        this.carHitBoxCollider.on(Contact2DType.PRE_SOLVE, this.onAttackingContactCar, this);
        this.carHitBoxCollider.on(Contact2DType.END_CONTACT, this.onEndAttackingContactCar, this);
    }

    private disableCollisionListeners() {
        this.carColliders.forEach(collider => {
            collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContactCar, this);
            collider.off(Contact2DType.END_CONTACT, this.onEndContactCar, this);
            // collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContactBound, this);
        });
        this.carHitBoxCollider.off(Contact2DType.BEGIN_CONTACT, this.onBeginAttackingContactCar, this);
        this.carHitBoxCollider.off(Contact2DType.PRE_SOLVE, this.onAttackingContactCar, this);
        this.carHitBoxCollider.off(Contact2DType.END_CONTACT, this.onEndAttackingContactCar, this);
    }


    onBeginContactCar(selfCollider: CircleCollider2D, otherCollider: CircleCollider2D, contact: IPhysics2DContact | null) {
        let selfCarStat = this.node.getComponent(CarStat);
        let otherNode = otherCollider.node;
        let otherCarHandler = otherNode.getComponent(CarCollisionHandler);
        let otherControler = otherNode.getComponent(CarController);
        let otherCarStat = otherNode.getComponent(CarStat);

        if (otherCollider.TYPE != ECollider2DType.CIRCLE &&
            otherNode.getComponent(GameObject).objectType != GameObjectType.Player ||
            otherNode.getComponent(GameObject).objectType != GameObjectType.Enemy) return;

        if (this.checkIsInImmortalSKill()) return;

        //capturing
        let pointsDiffRate = GameManager.instance.calculatePointDiffRate(selfCarStat.curPoint, otherCarStat.curPoint);
        if (pointsDiffRate != 0) return;

        const currentTime = Date.now() / 1000; // Current time in seconds
        // Exit if still in collision cooldown
        if (currentTime - this.lastCollisionTime < this.collisionCooldown) return;
        this.lastCollisionTime = currentTime;

        //main collision
        if (otherControler) {
            console.log("onBeginContactCar: ", selfCollider.name, otherCollider.name);
            this.isCollisionStaying = true;

            //stop the car
            if (this.rigidbody) {
                this.rigidbody.linearDamping += 999;
            }

            // Calculate push back direction
            const pushDirection = otherNode.worldPosition.subtract(selfCollider.node.worldPosition).normalize();
            const pushDistance = pushDirection.multiplyScalar(this.pushBackForce); // Adjust distance based on force

            let selfCenterPoint = new Vec2(this.node.worldPosition.x, this.node.worldPosition.y);
            let otherCenterPoint = new Vec2(otherNode.worldPosition.x, otherNode.worldPosition.y);
            let selfPoint = selfCenterPoint.subtract(selfCollider.worldPosition).multiplyScalar(1 / 2);
            let otherPoint = otherCenterPoint.subtract(otherCollider.worldPosition).multiplyScalar(1 / 2);

            this.rigidbody.linearDamping = 3;

            this.rigidbody.applyForce(new Vec2(-pushDistance.x, -pushDistance.y), selfCenterPoint, true);
            otherCarHandler?.rigidbody.applyForce(new Vec2(pushDistance.x, pushDistance.y), otherPoint, true);

            // Stun both cars
            this.stunCar(this.carController);
            this.stunCar(otherControler);
        }
    }
    onBeginAttackingContactCar(selfCollider: BoxCollider2D, otherCollider: BoxCollider2D, contact: IPhysics2DContact | null) {
        let selfCarStat = this.node.getComponent(CarStat);
        let otherNode = otherCollider.node;
        let otherCarStat = otherNode.getComponent(CarStat);

        if (otherCollider.TYPE != ECollider2DType.BOX &&
            otherNode.getComponent(GameObject).objectType != GameObjectType.Player ||
            otherNode.getComponent(GameObject).objectType != GameObjectType.Enemy) return;

        let pointsDiff = GameManager.instance.calculatePointDiff(selfCarStat.curPoint, otherCarStat.curPoint);
        let pointsDiffRate = GameManager.instance.calculatePointDiffRate(selfCarStat.curPoint, otherCarStat.curPoint);
        this._capturingPointPerFrame = this.calculatePointCapturingPerFrame(pointsDiff, pointsDiffRate, this.minCapturingInSeconds, this.maxCapturingInSeconds);
    }

    onAttackingContactCar(selfCollider: BoxCollider2D, otherCollider: BoxCollider2D, contact: IPhysics2DContact | null) {

        let selfCarStat = this.node.getComponent(CarStat);
        let otherNode = otherCollider.node;
        let otherCarHandler = otherNode.getComponent(CarCollisionHandler);
        let otherControler = otherNode.getComponent(CarController);
        let otherCarStat = otherNode.getComponent(CarStat);

        if (otherCollider.TYPE != ECollider2DType.BOX &&
            otherNode.getComponent(GameObject).objectType != GameObjectType.Player ||
            otherNode.getComponent(GameObject).objectType != GameObjectType.Enemy) return;

        let pointsDiffRate = GameManager.instance.calculatePointDiffRate(selfCarStat.curPoint, otherCarStat.curPoint);

        if (pointsDiffRate == 0 || Math.abs(selfCarStat.curPoint - otherCarStat.curPoint) >= ConstConfig.CARSTAT.DEFAUT_PARAM.maxPoint) {
            return;
        }

        if (selfCarStat.curPoint + this._capturingPointPerFrame > 1 && otherCarStat.curPoint + this._capturingPointPerFrame > 1) {
            console.log("collison staying - packed = :", this._capturingPointPerFrame);
            selfCarStat.changeCarPoint(this._capturingPointPerFrame, true);
            otherCarStat.changeCarPoint(-this._capturingPointPerFrame, false);
        }
    }
    onEndAttackingContactCar(selfCollider: BoxCollider2D, otherCollider: BoxCollider2D, contact: IPhysics2DContact | null) {
        this._capturingPointPerFrame = 0;
    }
    onEndContactCar(selfCollider: CircleCollider2D, otherCollider: CircleCollider2D) {
        this.isCollisionStaying = false;
        this.curCollisionState = CarCollisionState.Unknown;
    }
    onBeginContactBound(selfCollider: CircleCollider2D, otherCollider: BoxCollider2D, contact: IPhysics2DContact | null) {
        return;
        if (selfCollider.TYPE == ECollider2DType.CIRCLE && otherCollider.TYPE == ECollider2DType.BOX &&
            otherCollider.node.getComponent(GameObject).objectType == GameObjectType.Bounds) {
            console.log("wall contact", selfCollider.name, otherCollider.name);
            // Stun both cars
            this.stunCar(this.carController);

            // Calculate push back direction
            const pushDirection = this.getLookDirection();
            const pushDistance = pushDirection.multiplyScalar(this.pushBackForce); // Adjust distance based on force


            this.rigidbody.applyForce(new Vec2(pushDistance.x, pushDistance.y).multiplyScalar(-5), new Vec2(this.node.worldPosition.x, this.node.worldPosition.y), true);
        }
    }

    private pushBackCar(carNode: Node, pushDistance: Vec3) {
        const startPos = carNode.position.clone();
        const endPos = startPos.add(pushDistance);

        tween(carNode)
            .to(0.5, { position: endPos }, { easing: 'quadOut' })
            .start();
    }

    private stunCar(carController: CarController, duration: number = 1) {
        this.carController.setStunned(true);
        this.scheduleOnce(() => {
            this.easeVelocityToZero(duration);
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

    public deActiveSelfColliders() {
        this.carColliders.forEach(coll => coll.enabled = false);
    }
    public reActiveSelfColliders() {
        this.carColliders.forEach(coll => coll.enabled = true);
    }

    checkIsInImmortalSKill(): boolean {
        return SkillManager.instance.GetIsSkillConnected(Skill.Immortal);
    }
    update(dt: number) {
        this._deltaTime = dt;
        if (this.checkIsInImmortalSKill()) {
            this.carHitBoxCollider.enabled = false;
        }
        else {
            this.carHitBoxCollider.enabled = true;
        }
        switch (this.curCollisionState) {
            case CarCollisionState.Staying:
                break;
            case CarCollisionState.Unknown:
                break;
        }
    }

    calculatePointCapturingPerFrame(diff: number, diffRate: number, minCapturingInSec: number, maxCapturingInSec: number): number {
        let r = Math.abs(diff) / ((Math.abs(diffRate) + 0.9) * (60 * (maxCapturingInSec - minCapturingInSec)) + (60 * minCapturingInSec));
        return r;
    }

    onCapturing(selfPoint: number, otherPoint: number) {

    }
}