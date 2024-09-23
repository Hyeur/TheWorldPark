import { _decorator, Component, Node, Sprite, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CarVisualController')
export class CarVisualController extends Component {
    @property
    carTexture: Sprite = null;
    @property
    magnetTexture: Sprite = null;

    magnetTextureOpacity: UIOpacity = null;
    start() {
        this.node.getComponent(UIOpacity);
    }

    update(deltaTime: number) {
        
    }
}


