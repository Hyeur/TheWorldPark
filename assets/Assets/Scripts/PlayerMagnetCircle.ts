import { _decorator, BoxCollider2D, CircleCollider2D, Component, Contact2DType, ECollider2DType, Node, UIOpacity } from 'cc';
import { GameManager } from './GameManager';
import { GameObject, GameObjectType } from './GameObject';
import BoosterItem, { CollectibleState } from './BoosterItem';
import { CarController } from './CarController';
const { ccclass, property, executionOrder } = _decorator;
@ccclass('PlayerMagnetCircle')
@executionOrder(5)
export class PlayerMagnetCircle extends Component {
    @property(Node) playerNode: Node = null;
    @property(CircleCollider2D) cirCleCollider: CircleCollider2D = null;

    private visual: UIOpacity = null;
    // update (dt) {}
    onLoad() {
        

    }
    start() {
        if (!this.playerNode){
            this.playerNode = GameManager.instance.playerCar;
            
        }
        if (!this.cirCleCollider){
            this.cirCleCollider = this.node.getComponent(CircleCollider2D);
        }
        this.visual = this.node.getComponent(UIOpacity);

        if (this.cirCleCollider){
            this.cirCleCollider.on(Contact2DType.BEGIN_CONTACT, this.onMagnetContactBooster, this);
        }
    }

    onMagnetContactBooster(self: CircleCollider2D, other: BoxCollider2D){
        console.log("onMagnetContactBooster: ");
        if (other.TYPE == ECollider2DType.BOX && other.node.getComponent(GameObject).objectType == GameObjectType.Collectible){
            console.log("onMagnetContactBooster: ", self.name, other.name);
            let booster = other.node.getComponent(BoosterItem);
            if (!booster) return;
            booster.curState = CollectibleState.Collecting;
        }
    }

    setMagnetActive(isActive: boolean){
        this.setVisual(isActive);

        this.cirCleCollider.enabled = isActive;
    }

    setVisual(isActive: boolean){
        this.visual.opacity = isActive ? 100 : 0;
    }
}


