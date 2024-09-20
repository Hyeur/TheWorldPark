import { _decorator, Component, Vec2, Vec3, input, Input, EventKeyboard, KeyCode } from 'cc';
import { SkillManager, Skill } from './SkillManager';
const { ccclass, property } = _decorator;
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

    @property(SkillManager)
    skillManager: SkillManager | null = null;
    private _isLocalPlayer: boolean = false;
    protected direction: Vec2 = new Vec2(0, 1);
    protected isMovingUp: boolean = false;
    protected isMovingDown: boolean = false;
    protected isMovingLeft: boolean = false;
    protected isMovingRight: boolean = false;
    protected _curSpeed: number = 0;
    protected _curDirection: Vec2 = new Vec2(0, 0);
    private _isDead: boolean = false;
    private _isStunning: boolean = false;
    protected stunDurationInSeconds: number = 1;

    ////////////////bonus//////////////////
    protected _bonusSpeedRatio: number = 1.2;
    protected _bonusSpeedDurationInSeconds: number = 3;
    protected _magnetRadius: number = 100;
    protected _magnetDurationInSeconds: number = 5;
    protected _immortalDurationInSeconds: number = 5;
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
    protected set isStunning(value: boolean) {
        this._isStunning = value;
    }
    public get isLocalPlayer(): boolean {
        return this._isLocalPlayer;
    }
    public set isLocalPlayer(value: boolean) {
        this._isLocalPlayer = value;
    }
    public getWorldPosition(): Vec2 {
        return new Vec2(this.node.worldPosition.x, this.node.worldPosition.y);
    }

    public setWorldPosition(posWP: Vec2) {
        this.node.setPosition(new Vec3(posWP.x, posWP.y, 0));
    }


    isPlayerDie(): boolean {
        return this.isDead;
    }

    isPlayerStun(): boolean {
        return this.isStunning;
    }

    GetIsLocalPlayer(): boolean {
        return this.isLocalPlayer;
    }

    SetLocalPlayer(value: boolean): void {
        this._isLocalPlayer = value;
    }

    start() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);


        this._curSpeed = this.startSpeed;
        this._isDead = false;
        this._isStunning = false;

        this.skillManager = SkillManager.instance;
    }

    onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.KEY_W:
                this.isMovingUp = true;
                break;
            case KeyCode.KEY_S:
                this.isMovingDown = true;
                break;
            case KeyCode.KEY_A:
                this.isMovingLeft = true;
                break;
            case KeyCode.KEY_D:
                this.isMovingRight = true;
                break;
        }
    }

    onKeyUp(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.KEY_W:
                this.isMovingUp = false;
                break;
            case KeyCode.KEY_S:
                this.isMovingDown = false;
                break;
            case KeyCode.KEY_A:
                this.isMovingLeft = false;
                break;
            case KeyCode.KEY_D:
                this.isMovingRight = false;
                break;
        }
    }

    public updateVisual(direction?: Vec2): void {
        if (!direction) direction = this._curDirection;
        if (direction.x !== 0 || direction.y !== 0) {
            // Calculate the angle based on the direction vector
            const angle = Math.atan2(direction.x, direction.y) * (180 / Math.PI);

            // Set the rotation of the car
            this.node.setRotationFromEuler(0, 0, -angle);
        }
    }
    public applyMovement(deltaTime: number, direction?: Vec2, speed?: number): void {
        if (this.isPlayerDie()) return;
        if (!direction) direction = this._curDirection;

        let curSpeed = this._curSpeed;
        if (speed) curSpeed = speed;

        if (this._bonusSpeedRatio > 1 && this._bonusSpeedDurationInSeconds > 0) {
            curSpeed *= this._bonusSpeedRatio;
        }
        this.updateVisual(direction);
        const posWS = this.node.getPosition();

        let moveDelta = new Vec2(direction.x, direction.y).multiplyScalar(curSpeed * deltaTime);

        // console.log(curSpeed);
        this.node.setPosition(posWS.add(new Vec3(moveDelta.x, moveDelta.y, 0)));
    }

    public applySkill(skill: Skill): void {
        if (!this.isLocalPlayer || !this.skillManager) return;

        const preset = this.skillManager.getSkillPreset(skill);
        if (!preset) return;

        switch (skill) {
            case Skill.BonusSpeed:
                this.SetBonusSpeed(preset.ratio, preset.duration);
                break;
            case Skill.Magnet:
                this.SetMagnet(preset.radius, preset.duration);
                break;
            case Skill.Immortal:
                this.SetImmortal(preset.duration);
                break;
        }

        this.skillManager.activateSkill(skill);
    }

    update(deltaTime: number) {
        let targetDirection = new Vec2(0, 0);

        if (this.isLocalPlayer) {
            if (this.isMovingUp) targetDirection.y += 1;
            if (this.isMovingDown) targetDirection.y -= 1;
            if (this.isMovingLeft) targetDirection.x -= 1;
            if (this.isMovingRight) targetDirection.x += 1;
        }


        if (targetDirection.x !== 0 || targetDirection.y !== 0) {
            targetDirection.normalize();

            // Lerp the current direction towards the target direction
            this._curDirection = new Vec2(
                this.lerp(this._curDirection.x, targetDirection.x, this.rotationLerpSpeed * deltaTime),
                this.lerp(this._curDirection.y, targetDirection.y, this.rotationLerpSpeed * deltaTime)
            );

            //Lerp the current speed towards the target speed
            this._curSpeed = this.lerp(this._curSpeed, this.maxSpeed, deltaTime * this.acceleration);

            this.applyMovement(deltaTime, this._curDirection);
        }
        else {
            this._curSpeed = this.lerp(this._curSpeed, 0, deltaTime * this.deceleration);
            this.applyMovement(deltaTime, this._curDirection, this._curSpeed);
        }
    }

    private lerp(start: number, end: number, t: number): number {
        return start + (end - start) * Math.min(1, t);
    }

    SetBonusSpeed(bonusSpeedRatio: number, bonusSpeedDurationInSeconds: number): void {
        this._bonusSpeedRatio = bonusSpeedRatio;
        this._bonusSpeedDurationInSeconds = bonusSpeedDurationInSeconds;
    }

    SetMagnet(magnetRadius: number, magnetDurationInSeconds: number): void {
        this._magnetRadius = magnetRadius;
        this._magnetDurationInSeconds = magnetDurationInSeconds;
    }

    SetImmortal(immortalDurationInSeconds: number): void {
        this._immortalDurationInSeconds = immortalDurationInSeconds;
    }
}