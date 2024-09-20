import { _decorator, Component, Vec2, Vec3, input, Input, EventKeyboard, KeyCode } from 'cc';
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

    protected direction: Vec2 = new Vec2(0, 1);
    protected isMovingUp: boolean = false;
    protected isMovingDown: boolean = false;
    protected isMovingLeft: boolean = false;
    protected isMovingRight: boolean = false;
    protected _curSpeed: number = 0;
    protected _curDirection: Vec2 = new Vec2( 0, 0 );
    private _isDead: boolean = false;

        ////////////////bonus//////////////////
    protected bonusSpeedRatio: number = 1.2;
    
    protected get isDead(): boolean {
        return this._isDead;
    }
    protected set isDead(value: boolean) {
        this._isDead = value;
    }

    public getWorldPosition(): Vec2 {
        return new Vec2(this.node.worldPosition.x, this.node.worldPosition.y);
    }

    public setWorldPosition( posWP:Vec2 ) {
        this.node.setPosition(new Vec3(posWP.x, posWP.y, 0));
    }



    start() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);


        this._curSpeed = this.startSpeed;
        this._isDead = false;
    }

    isPlayerDie (): boolean {
        return this.isDead;
    }


    onKeyDown(event: EventKeyboard) {
        switch(event.keyCode) {
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
        switch(event.keyCode) {
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
    public applyMovement( deltaTime: number , direction?: Vec2 , speed?: number) :void {
        if ( this.isPlayerDie() ) return;
        if (!direction) direction = this._curDirection;

        let curSpeed = this._curSpeed;
        if (speed) curSpeed = speed;

        if (this.bonusSpeedRatio > 1) {
            curSpeed *= this.bonusSpeedRatio;
        }
        this.updateVisual(direction);
        const posWS = this.node.getPosition();

        let moveDelta = new Vec2(direction.x, direction.y).multiplyScalar(curSpeed * deltaTime);

        console.log(curSpeed);
        this.node.setPosition(posWS.add(new Vec3(moveDelta.x, moveDelta.y, 0)));
    }

    update(deltaTime: number) {
        let targetDirection = new Vec2(0, 0);
        
        if (this.isMovingUp) targetDirection.y += 1;
        if (this.isMovingDown) targetDirection.y -= 1;
        if (this.isMovingLeft) targetDirection.x -= 1;
        if (this.isMovingRight) targetDirection.x += 1;
        
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
}


