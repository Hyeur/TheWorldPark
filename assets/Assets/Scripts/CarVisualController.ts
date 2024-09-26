import { _decorator, Color, Component, Node, Sprite, UIOpacity } from 'cc';
import { CarCollisionHandler } from './CarCollisionHandler';
const { ccclass, property } = _decorator;

@ccclass('CarVisualController')
export class CarVisualController extends Component {
    @property(CarCollisionHandler)
    carCollisionHandler: CarCollisionHandler = null;
    @property(Sprite)
    carTexture: Sprite = null;
    @property(Sprite)
    magnetTexture: Sprite = null;

    magnetTextureOpacity: UIOpacity = null;
    start() {
        
    }

    update(deltaTime: number) {
        this.setIsUnderAttack();
        
    }

    setIsUnderAttack(){
        if (!this.carCollisionHandler) return;
        this.carTexture.color = this.carCollisionHandler.getIsUnderAttack()? Color.RED : Color.WHITE;
    }
}


