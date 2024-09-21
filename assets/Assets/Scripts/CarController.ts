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
    protected movement: { [key: string]: boolean } = {
        up: false, down: false, left: false, right: false
    };
    protected _curSpeed: number = 0;
    protected _curDirection: Vec2 = new Vec2(0, 0);
    private _isDead: boolean = false;
    private _isStunning: boolean = false;
    protected stunDurationInSeconds: number = 1;

    ////////////////bonus//////////////////
    protected _bonusSpeedRatio: number = 1.2;
    protected _magnetRadius: number = 100;
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

    private skillDurations: Map<Skill, number> = new Map([
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

    GetIsLocalPlayer(): boolean {
        return this.isLocalPlayer;
    }

    SetLocalPlayer(value: boolean): void {
        this._isLocalPlayer = value;
    }

    start() {
        if(this.isLocalPlayer){
            this.setupInputListeners();
            this.skillManager = SkillManager.instance;
        }
        this.initializeState();
    }

    private setupInputListeners() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    private initializeState() {
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

    private updateMovementState(keyCode: KeyCode, isPressed: boolean) {
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

        //normal speed
        let curSpeed = this._curSpeed;
        if (speed) curSpeed = speed;

        //bonus speed
        if (this.IsSkillConnected(Skill.BonusSpeed)) {
            curSpeed *= this._bonusSpeedRatio;
        }

        //magnet

        //immortal

        //car visual
        this.updateVisual(direction);

        //car move
        const posWS = this.node.getPosition();
        let moveDelta = new Vec2(direction.x, direction.y).multiplyScalar(curSpeed * deltaTime);
        //console.log(curSpeed);
        this.node.setPosition(posWS.add(new Vec3(moveDelta.x, moveDelta.y, 0)));
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
        if (this.isStunned) {
            // Don't process input while stunned
            return;
        }

        if (this.isLocalPlayer) {
            this.updateLocalPlayerMovement(deltaTime);
            this.updateSkillDurations(deltaTime);
        }
    }

    private updateLocalPlayerMovement(deltaTime: number) {
        const targetDirection = this.calculateTargetDirection();
        this.updateCurrentDirection(targetDirection, deltaTime);
        this.updateCurrentSpeed(targetDirection, deltaTime);
        this.applyMovement(deltaTime, this._curDirection, this._curSpeed);
    }

    private calculateTargetDirection(): Vec2 {
        let target = new Vec2(0, 0);
        if (this.movement.up) target.y += 1;
        if (this.movement.down) target.y -= 1;
        if (this.movement.left) target.x -= 1;
        if (this.movement.right) target.x += 1;
        return target.normalize();
    }

    private updateCurrentDirection(targetDirection: Vec2, deltaTime: number) {
        if (targetDirection.x !== 0 || targetDirection.y !== 0) {
            this._curDirection = new Vec2(
                this.lerp(this._curDirection.x, targetDirection.x, this.rotationLerpSpeed * deltaTime),
                this.lerp(this._curDirection.y, targetDirection.y, this.rotationLerpSpeed * deltaTime)
            );
        }
    }

    private updateCurrentSpeed(targetDirection: Vec2, deltaTime: number) {
        if (targetDirection.x !== 0 || targetDirection.y !== 0) {
            this._curSpeed = this.lerp(this._curSpeed, this.maxSpeed, deltaTime * this.acceleration);
        } else {
            this._curSpeed = this.lerp(this._curSpeed, 0, deltaTime * this.deceleration);
        }
    }

    private lerp(start: number, end: number, t: number): number {
        return start + (end - start) * Math.min(1, t);
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
        this.node.destroy();
        console.log("CarController destroyed");
    }

    private removeInputListeners() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    public getSkillRemainingDurations(skill: Skill): number {
        return this.skillDurations.get(skill) || 0;
    }

    private updateSkillDurations(deltaTime: number) {
        this.skillDurations.forEach((duration, skill) => {
            if (duration > 0 && this.IsSkillConnected(skill)) {
                this.skillDurations.set(skill, duration - deltaTime);
            }

        });
    }

    private IsSkillConnected(skill: Skill): boolean {
        return SkillManager.instance.GetisSkillConnected(skill);
    }

    private isStunned: boolean = false;

    setStunned(stunned: boolean) {
        this.isStunned = stunned;
    }
}