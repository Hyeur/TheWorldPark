import { _decorator, Component, Node, Quat, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NoRotating')
export class NoRotating extends Component {

    update(deltaTime: number) {
        this.node.setWorldRotationFromEuler(0,0,0); // Updated method
    }
}


