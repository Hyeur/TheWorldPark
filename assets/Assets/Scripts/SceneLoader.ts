import { _decorator, Component, Node, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SceneLoader')
export class SceneLoader extends Component {
    loadGameScene() {
        director.loadScene('GameScene', (err) => {
            if (err) {
                console.error('Failed to load the scene:', err);
            }
        });
    }
}


