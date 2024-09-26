import { _decorator, Component, Node, Sprite, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CarVisualController')
export class CarVisualController extends Component {
    @property(Sprite)
    carTexture: Sprite = null;
    @property(Sprite)
    magnetTexture: Sprite = null;

    magnetTextureOpacity: UIOpacity = null;
    start() {
    
    }

    update(deltaTime: number) {
        
    }
}


