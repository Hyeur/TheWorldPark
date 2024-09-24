import { _decorator, BoxCollider2D, CircleCollider2D, Component, Contact2DType, ECollider2DType, Label, Node, UIOpacity } from 'cc';
import { GameObject, GameObjectType } from './GameObject';
import { CarController, CarControllerState } from './CarController';
import { ConstConfig } from './Utils/ConstConfig';
import { BoosterSpawner } from './BoosterSpawner';
import { CarStat } from './CarStat';
const { ccclass, property } = _decorator;

export enum CollectibleState {
    Idle,
    Collecting,
    Hidding
}

@ccclass('BoosterItem')
export default class BoosterItem extends Component {
    boosterID: number = 0;
    static nextBoosterID: number = 0;
    curState: CollectibleState = CollectibleState.Idle;

    timeActive: number = ConstConfig.BOOSTER.PARAM.timeActive;
    pointGiving: number = 0;

    collectiveSoundId: number = null;

    private collider: BoxCollider2D = null;

    private texture: UIOpacity = null;
    
    private pointText: Label = null;

    onLoad() {
        if (!this.collider) {
            this.collider = this.getComponent(BoxCollider2D);
        }
        this.texture = this.node.getComponent(UIOpacity);
        this.pointText = this.node.getComponentInChildren(Label);
    }

    start() {
        if (this.collider) {
            this.collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
        }
    }

    onCollisionEnter(self: BoxCollider2D, other: CircleCollider2D) {
        this.disableCollider();
        let whoCollided = other.node.getComponent(GameObject);
        console.log("onCollect: ", self.name, other.name);
        if (whoCollided && whoCollided.objectType == GameObjectType.Player ||
            whoCollided.objectType == GameObjectType.Enemy &&
            this.curState == CollectibleState.Idle
        ) {
            let playerCarController = whoCollided.node.getComponent(CarController);
            let playerStat = playerCarController.node.getComponent(CarStat);
            if (playerCarController.curState == CarControllerState.Dead) return;
            this.curState = CollectibleState.Collecting;
            playerStat.changeCarPoint(this.pointGiving);
            
        }
    }

    update(deltaTime: number) {
        switch (this.curState) {
            case CollectibleState.Idle:
                this.pointText.string = this.pointGiving.toString();
                if (this.timeActive > 0) {
                    this.timeActive -= deltaTime;
                }
                else {
                    this.rePosition();
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
        this.timeActive = ConstConfig.BOOSTER.PARAM.timeActive;
    }

    setHide(isHiding: boolean) {
        if (isHiding) {
            BoosterSpawner.instance.currentBoosterCount--;
        }
        else {
            this.rePosition();
            this.enableCollider();
            BoosterSpawner.instance.currentBoosterCount++;
        }
        this.curState = isHiding ? CollectibleState.Hidding : CollectibleState.Idle;

        this.texture.opacity = isHiding ? 0 : 255;
    }

    onDestroy() {
        if (this.collider) {
            this.collider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
        }
    }

    enableCollider() {
        if (!this.collider) return;
        this.collider.enabled = true;
    }

    disableCollider() {
        if (!this.collider) return;
        this.collider.enabled = false;
    }

}
