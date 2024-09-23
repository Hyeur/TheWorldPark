import { _decorator, Component, Node, instantiate, Prefab } from 'cc';
import { CarController } from './CarController';

const { ccclass, property, executionOrder } = _decorator;

@ccclass('GameManager')
@executionOrder(0)
export class GameManager extends Component {
    private static _instance: GameManager | null = null;

    public static get instance(): GameManager {
        if (!this._instance) {
            throw new Error('GameManager is not initialized');
        }
        return this._instance;
    }

    @property(Prefab)
    carPrefab: Prefab | null = null;
    @property(Node)
    playerCar: Node | null = null;
    @property()
    playerCarController: CarController | null = null;
    @property(Node)
    playerSpawnPoint: Node | null = null;


    onLoad() {
        if (GameManager._instance) {
            this.node.destroy();
        } else {
            GameManager._instance = this;
        }
    }

    start() {
        if (!this.playerCarController) {
            this.spawnPlayerCar();
        }
    }

    private spawnPlayerCar() {
        if (!this.carPrefab || !this.playerSpawnPoint) return;

        const playerCar = instantiate(this.carPrefab);
        playerCar.setParent(this.node);
        playerCar.setWorldPosition(this.playerSpawnPoint.worldPosition);
        this.playerCar = playerCar;

        const carController = playerCar.getComponent(CarController);
        if (carController) {
            carController.SetLocalPlayer(true);
            this.playerCarController = carController;
        }
    }

    onDestroy() {
        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
        this.node.destroy();
        console.log("GameManager destroyed");
    }
}