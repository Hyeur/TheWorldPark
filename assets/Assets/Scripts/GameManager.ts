import { _decorator, Component, Node, instantiate, Prefab } from 'cc';
import { CarController } from './CarController';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    private static _instance: GameManager | null = null;

    public static get instance(): GameManager {
        if (!this._instance) {
            throw new Error('GameManager is not initialized');
        }
        return this._instance;
    }

    onLoad() {
        if (GameManager._instance) {
            this.node.destroy();
        } else {
            GameManager._instance = this;
        }
    }

    onDestroy() {
        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
    }

    @property(Prefab)
    carPrefab: Prefab | null = null;

    @property(Node)
    playerSpawnPoint: Node | null = null;

    start() {
        if (!this.findLocalPlayerCar()) {
            this.spawnPlayerCar();
        }
    }

    private spawnPlayerCar() {
        if (this.carPrefab && this.playerSpawnPoint) {
            const playerCar = instantiate(this.carPrefab);
            playerCar.setParent(this.node);
            playerCar.setWorldPosition(this.playerSpawnPoint.worldPosition);

            const carController = playerCar.getComponent(CarController);
            if (carController) {
                carController.SetLocalPlayer(true);
            }
        }
    }

    public findLocalPlayerCar(out?: CarController): boolean {
        const carControllers = this.node.scene.getComponentsInChildren(CarController);
        return carControllers.find(car => car.isLocalPlayer) != null;
    }

}