import { _decorator, Component, Node, Rect, director } from 'cc';
const { ccclass, property,  executionOrder} = _decorator;

@ccclass('ScreenManager')
@executionOrder(2)
export class ScreenManager extends Component {

    // Singleton setup
    private static _instance: ScreenManager | null = null;
    public static get instance(): ScreenManager {
        if (!this._instance) {
            const node = new Node('ScreenManager');
            this._instance = node.addComponent(ScreenManager);
        }
        return this._instance;
    }

    @property(Rect)
    battleArea: Rect = new Rect(0,0,1280,720);
    
    start() {

    }
}


