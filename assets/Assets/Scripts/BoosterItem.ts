import { _decorator, CircleCollider2D, Component, Contact2DType, Node, UIOpacity } from 'cc';
import { GameObject, GameObjectType } from './GameObject';
import { CarController, CarState } from './CarController';
import { ConstConfig } from './Utils/ConstConfig';
import { BoosterSpawner } from './BoosterSpawner';
const { ccclass, property } = _decorator;

export enum CollectibleState {
    Idle,
    Collecting,
    Hidding
}

@ccclass('BoosterItem')
export default class BoosterItem extends Component {
    boosterID: number = 0;
    static nextBoosterID:number = 0;
    curState: CollectibleState = CollectibleState.Idle;

    timeActive: number = ConstConfig.BOOSTER.PARAM.timeActive;
    pointGiving: number = 0;

    collectiveSoundId: number = null;

    private collider: CircleCollider2D = null;

    private visual: UIOpacity = null;

    onLoad() {
        if (!this.collider){
            this.collider = this.getComponent(CircleCollider2D);
        }
        this.visual = this.node.getComponent(UIOpacity);
    }

    start(){
        this.registerEvents();
    }

    onCollisionEnter(self: CircleCollider2D, other:CircleCollider2D){
        console.log("onCollect");
        let whoCollided = other.node.getComponent(GameObject);
        if (whoCollided.objectType == (GameObjectType.Player || GameObjectType.Enemy) &&
            this.curState == CollectibleState.Idle
        ){
            let player = whoCollided.node.getComponent(CarController);
            if (player.curState == CarState.Dead) return;
            this.curState = CollectibleState.Collecting;
        }
    }

    update(deltaTime: number) {
        switch (this.curState){
            case CollectibleState.Idle:
                if (this.timeActive > 0){
                    this.timeActive -= deltaTime;
                }
                break;
            case CollectibleState.Collecting:
                this.setHide(true);
                break;
            case CollectibleState.Hidding:
                
                break;
        }
    }

    //repooling, collected
    resetData(newData: BoosterItem) {
        this.boosterID = newData.boosterID;
        this.pointGiving = newData.pointGiving;
        this.timeActive = ConstConfig.BOOSTER.PARAM.timeActive;
        this.curState = CollectibleState.Idle;
    }

    //no one collect, timeActive end
    rePosition() {
        BoosterSpawner.instance.rePositionBoosterNode(this.node);
    }

    setHide(isHiding: boolean) {
        if (isHiding){
            this.unregisterEvents();
        }
        else{
            this.registerEvents();
        }
        this.curState = isHiding ? CollectibleState.Hidding : CollectibleState.Idle;

        this.visual.opacity = isHiding ? 0 : 255;
    }

    onDestroy() {
        if (this.collider){
            this.collider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
        }
    }

    registerEvents(){
        if (!this.collider) return;
        this.collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
    }

    unregisterEvents(){
        if (!this.collider) return;
        this.collider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
    }

}


