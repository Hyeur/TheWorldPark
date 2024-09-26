import { _decorator, Component, instantiate, Node, Prefab, Quat, Vec2, Vec3 } from 'cc';
import { ScreenManager } from './ScreenManager';
const { ccclass, property } = _decorator;

@ccclass('BoundManager')
export class BoundManager extends Component {
    @property(Prefab)
    boundPrefab: Prefab = null;

    start() {
        this.setUpBounds(new Vec2(0,-ScreenManager.instance.battleArea.height));
        this.setUpBounds(new Vec2(0,ScreenManager.instance.battleArea.height));
        
        this.setUpBounds(new Vec2(-ScreenManager.instance.battleArea.width,0), true);
        this.setUpBounds(new Vec2(ScreenManager.instance.battleArea.width,0), true);
    }

    update(deltaTime: number) {
        
    }

    setUpBounds(pos: Vec2, vertical: boolean = false){
        const b = instantiate(this.boundPrefab);
        b.setParent(this.node);
        b.setPosition(new Vec3(pos.x, pos.y));
        if (vertical) b.setRotationFromEuler(0,0,90);
    }
}


