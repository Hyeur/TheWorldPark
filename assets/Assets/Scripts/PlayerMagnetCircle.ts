import { _decorator, CircleCollider2D, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerMagnetCircle')
export class PlayerMagnetCircle extends Component {
    @property(Node) playerNode: Node = null;
    @property(CircleCollider2D) cirCleCollider: CircleCollider2D = null;
    // update (dt) {}
    onLoad(){
        {
        // this.cirCleCollider.radius = Game.inst.playerParameters.magnetCircleRadius
        }
    }
}


