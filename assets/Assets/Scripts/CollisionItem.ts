import { _decorator, Component, Node, CircleCollider2D } from 'cc';
import { CarCollisionHandler } from './CarCollisionHandler';

const { ccclass, property } = _decorator;

@ccclass('CollisionItem')
export class CollisionItem extends Component {
    onLoad() {
        
    }
    start() {
        this.addCollidersToHandler();
    }

    private addCollidersToHandler() {
        const carCollisionHandler = this.node.parent?.getComponent(CarCollisionHandler);
        if (carCollisionHandler) {
            const circleColliders = this.getComponents(CircleCollider2D);
            circleColliders.forEach(collider => {
                carCollisionHandler.addCarCollider(collider);
            });
        }
    }
}


