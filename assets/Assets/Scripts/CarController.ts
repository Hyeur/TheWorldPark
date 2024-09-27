import { _decorator, Component, Vec2, Vec3, input, Input, EventKeyboard, KeyCode, RigidBody2D, clamp01, CircleCollider2D, EventTouch } from 'cc';
import { SkillManager, Skill } from './SkillManager';
import { CarCollisionHandler } from './CarCollisionHandler';
import { Tools } from './Utils/Tools';
import { CarStat } from './CarStat';
import { ConstConfig } from './Utils/ConstConfig';
import { instance, Joystick, SpeedType } from "./Joystick";
import type { JoystickDataType } from "./Joystick";
const { ccclass, property } = _decorator;

export enum CarControllerState {
    Idle,
    Running,
    Turboing,
    Stunned,
    Dead
}

const FORCE_CONSTANT = 25;
@ccclass('CarController')
export class CarController extends Component {
    @property
    startSpeed: number = 150;
    @property
    maxSpeed: number = 200;
    @property
    acceleration: number = 100;
    @property
    deceleration: number = 20;
    @property
    rotationSpeed: number = 180;

    @property
    rotationLerpSpeed: number = 5; // New property for controlling rotation smoothness

    protected t: number = 0;

    protected maxSpeedPower = 0;
    protected skillManager: SkillManager | null = null;
    protected CarCollisionHandler: CarCollisionHandler | null = null;
    protected CarStat: CarStat | null = null;
    protected rigidbody: RigidBody2D | null = null;
    protected _isLocalPlayer: boolean = false;
    protected direction: Vec2 = new Vec2(0, 1);
    protected movement: { [key: string]: boolean } = {
        up: false, down: false, left: false, right: false
    };
    protected _curSpeed: number = 0;
    protected _curMomentumDirection: Vec2 = new Vec2(0, 0);
    public set curMomentumDirection(value: Vec2) {
        this._curMomentumDirection = value;
    }
    protected _isDead: boolean = false;
    protected _isStunning: boolean = false;
    protected stunDurationInSeconds: number = 1;


    public curState: CarControllerState = CarControllerState.Idle;

    ////////////////bonus//////////////////
    protected _bonusSpeedRatio: number = 1.2;
    protected _magnetRadius: number = 100;
    protected _immortalDuration: number = 3;
    ////////////////////////////////////////
    protected get isDead(): boolean {
        return this._isDead;
    }
    protected set isDead(value: boolean) {
        this._isDead = value;
    }
    protected get isStunning(): boolean {
        return this._isStunning;
    }
    public get isLocalPlayer(): boolean {
        return this._isLocalPlayer;
    }
    public getWorldPosition(): Vec2 {
        return new Vec2(this.node.worldPosition.x, this.node.worldPosition.y);
    }

    public setWorldPosition(posWP: Vec2) {
        this.node.setPosition(new Vec3(posWP.x, posWP.y, 0));
    }

    public skillDurations: Map<Skill, number> = new Map([
        [Skill.BonusSpeed, 0],
        [Skill.Magnet, 0],
        [Skill.Immortal, 0]
    ]);

    isPlayerDie(): boolean {
        return this.isDead;
    }

    isPlayerStun(): boolean {
        return this.isStunning;
    }
    SetLocalPlayer(value: boolean): void {
        this._isLocalPlayer = value;
    }
    joystick: Joystick = null;
    onLoad() {
    }

    onEnable() {
        this.node.on('JoystickMove', this.onTouchMove, this);
        //input.on(Input.EventType.TOUCH_END, this.onTouchEnd.bind(this), this);
    }

    onDisable() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart.bind(this), this)
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove.bind(this), this);
        //input.off(Input.EventType.TOUCH_END, this.onTouchEnd.bind(this), this);
    }

    onTouchStart(){}

    onTouchMove(data: Vec2): void {
        console.log('data: ', data);
        // this._curMomentumDirection = new Vec2(data.moveVec.x, data.moveVec.y);
    }
    start() {
        if (this.isLocalPlayer) {
            this.setupInputListeners();
            this.skillManager = SkillManager.instance;
        }
        this.CarCollisionHandler = this.node.getComponent(CarCollisionHandler);
        this.CarStat = this.node.getComponent(CarStat);
        this.rigidbody = this.node.getComponent(RigidBody2D);
        this.initializeState();
        this.maxSpeedPower = this.maxSpeed * 1.2;

        
    }

    protected setupInputListeners() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    protected initializeState() {
        this._curSpeed = this.startSpeed;
        this._isDead = false;
        this._isStunning = false;

    }

    onKeyDown(event: EventKeyboard) {
        this.updateMovementState(event.keyCode, true);
    }

    onKeyUp(event: EventKeyboard) {
        this.updateMovementState(event.keyCode, false);
    }

    protected updateMovementState(keyCode: KeyCode, isPressed: boolean) {
        const keyMap: { [key: number]: string } = {
            [KeyCode.KEY_W]: 'up',
            [KeyCode.KEY_S]: 'down',
            [KeyCode.KEY_A]: 'left',
            [KeyCode.KEY_D]: 'right'
        };
        const direction = keyMap[keyCode];
        if (direction) {
            this.movement[direction] = isPressed;
        }
    }

    public updateVisual(direction?: Vec2): void {
        if (!direction) direction = this._curMomentumDirection;

        if (this.isStunned) {
            return;
        }


        if (direction.x !== 0 || direction.y !== 0) {
            // Calculate the angle based on the direction vector
            const angle = Math.atan2(direction.x, direction.y) * (180 / Math.PI);

            // Set the rotation of the car
            this.node.setRotationFromEuler(0, 0, -angle);
        }
    }
    public applyMovement(deltaTime: number, direction?: Vec2, speed?: number): void {
        if (this.isPlayerDie() || this.isStunned) {
            return;
        }

        if (!direction) direction = this._curMomentumDirection;
        if (direction != Vec2.ZERO) this.curState = CarControllerState.Running;

        //normal speed
        let curSpeed = this._curSpeed;
        if (speed) curSpeed = speed;

        //bonus speed
        if (this.IsSkillConnected(Skill.BonusSpeed)) {
            curSpeed *= this._bonusSpeedRatio;
            this.curState = CarControllerState.Turboing;
        }

        //magnet

        //immortal

        //car move        
        const posWS = this.node.getPosition();
        let moveDelta = new Vec2(direction.x, direction.y).multiplyScalar(curSpeed * deltaTime * FORCE_CONSTANT);
        // this.node.setPosition(posWS.add(new Vec3(moveDelta.x, moveDelta.y, 0)));
        this.rigidbody.applyForceToCenter(moveDelta, true); // Changed from function call to property assignment
    }

    public connectSkill(skill: Skill, apply: boolean = true): void {
        if (!this.isLocalPlayer || !this.skillManager) return;

        const preset = this.skillManager.getSkillPreset(skill);
        if (!preset) return;

        switch (skill) {
            case Skill.BonusSpeed:
                if (apply) {
                    this.SetBonusSpeed(preset.ratio, preset.duration);
                } else {
                    this.SetBonusSpeed(1, 0);
                }
                break;

            case Skill.Magnet:
                if (apply) {
                    this.SetMagnet(preset.radius, preset.duration);
                } else {
                    this.SetMagnet(0, 0);
                }
                break;
            case Skill.Immortal:
                if (apply) {
                    this.SetImmortal(preset.duration);
                } else {
                    this.SetImmortal(0);
                }
                break;
        }
    }
    update(deltaTime: number) {
        this.updateCurrentMomentumDirection(deltaTime);
        if (this.isLocalPlayer) {
            this.updateSkillDurations(deltaTime);
            this.updateCurrentMomentumDirection(deltaTime, this.joystick?.outMove);
        }

        this.updateCurrentSpeed(deltaTime);
        this.applyMovement(deltaTime, this._curMomentumDirection, this._curSpeed);
        this.updateVisual();

    }

    // protected updateLocalPlayerMovement(deltaTime: number) {
    //     this.updateCurrentSpeed(this._curMomentumDirection, deltaTime);
    // }

    protected LocalCalculateTargetMomentumDirection(): Vec2 {
        let target = new Vec2(0, 0);
        if (this.movement.up) target.y += 1;
        if (this.movement.down) target.y -= 1;
        if (this.movement.left) target.x -= 1;
        if (this.movement.right) target.x += 1;
        return target.normalize();
    }

    public updateCurrentMomentumDirection(deltaTime: number, target: Vec2 = this._curMomentumDirection) {
        if (target.x !== 0 || target.y !== 0) {
            this._curMomentumDirection = new Vec2(
                this.lerp(this._curMomentumDirection.x, target.x, this.rotationLerpSpeed * deltaTime),
                this.lerp(this._curMomentumDirection.y, target.y, this.rotationLerpSpeed * deltaTime)
            );
        }
        else {
            this._curMomentumDirection = Vec2.ZERO;
        }

        //normalize direction
        this._curMomentumDirection.normalize();
    }

    protected updateCurrentSpeed(deltaTime: number) {
        if (this.isStunned) {
            this._curSpeed = 0;
            return;
        }
        let targetSpeed = (this._curMomentumDirection != Vec2.ZERO) ? this.maxSpeed : 0;
        let targetAccel = (this._curMomentumDirection != Vec2.ZERO) ? this.acceleration : this.deceleration;
        let isLerping = (this._curMomentumDirection != Vec2.ZERO) ? true : false;
        targetSpeed = targetSpeed + ((this.CarStat.curPoint / ConstConfig.CARSTAT.DEFAUT_PARAM.maxPoint) * Math.abs((this.maxSpeedPower - this.maxSpeed)));

        if (isLerping) {
            this.t += deltaTime / targetAccel;
            this._curSpeed = this.lerp(this._curSpeed, targetSpeed, clamp01(this.t));

            if (Math.abs(this._curSpeed - targetSpeed) < 20) {
                this._curSpeed = targetSpeed;
                isLerping = false;  // Stop lerping when target is reached
                this.t = 0;  // Reset lerp factor for next acceleration
            }
        }
    }

    protected lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }

    SetBonusSpeed(bonusSpeedRatio: number, bonusSpeedDurationInSeconds: number): void {
        this._bonusSpeedRatio = bonusSpeedRatio;
        this.skillDurations.set(Skill.BonusSpeed, bonusSpeedDurationInSeconds);
    }

    SetMagnet(magnetRadius: number, magnetDurationInSeconds: number): void {
        this._magnetRadius = magnetRadius;
        this.skillDurations.set(Skill.Magnet, magnetDurationInSeconds);
    }

    SetImmortal(immortalDurationInSeconds: number): void {
        this.skillDurations.set(Skill.Immortal, immortalDurationInSeconds);
    }

    onDestroy() {
        this.removeInputListeners();
        console.log("CarController destroyed:", this.node.name);
        this.node.destroy();
    }

    protected removeInputListeners() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    public getSkillRemainingDurations(skill: Skill): number {
        return this.skillDurations.get(skill) || 0;
    }

    protected updateSkillDurations(deltaTime: number) {
        this.skillDurations.forEach((duration, skill) => {
            if (duration > 0) {
                this.skillDurations.set(skill, duration - deltaTime);
            }
        });
    }

    protected IsSkillConnected(skill: Skill): boolean {
        return SkillManager.instance.GetisSkillConnected(skill);
    }

    protected isStunned: boolean = false;

    setStunned(stunned: boolean) {
        this.isStunned = stunned;
        this._curMomentumDirection = Vec2.ZERO;
        this.curState = CarControllerState.Stunned;

        if (!stunned) {
            this._curMomentumDirection = Vec2.ZERO;
            this._curSpeed = 0;
            if (this.rigidbody) {
                this.rigidbody.linearDamping = 3;
            }
        }
        else {

        }
    }
}