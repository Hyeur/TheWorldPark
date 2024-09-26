import { _decorator, Component, Node, instantiate, Prefab, Vec2, Vec3 } from 'cc';
import { CarController } from './CarController';
import { Tools } from './Utils/Tools';
import { ScreenManager } from './ScreenManager';
import { AICarController } from './AICarController';

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
    playerCarPrefab: Prefab | null = null;
    @property(Prefab)
    AICarPrefab: Prefab | null = null;
    @property(Node)
    playerCar: Node | null = null;
    @property()
    playerCarController: CarController | null = null;
    @property(Node)
    playerSpawnPoint: Node | null = null;

    @property
    AICount: number = 5;

    onLoad() {
        if (GameManager._instance) {
            this.node.destroy();
        } else {
            GameManager._instance = this;
        }
        if (!this.playerCarController) {
            this.spawnPlayerCar();
        }
    }

    start() {
        this.spawnAI();
        
    }

    private spawnPlayerCar() {
        if (!this.playerCarPrefab || !this.playerSpawnPoint) return;

        const playerCar = instantiate(this.playerCarPrefab);
        playerCar.setParent(this.node);
        playerCar.setWorldPosition(this.playerSpawnPoint.worldPosition);
        this.playerCar = playerCar;

        const carController = playerCar.getComponent(CarController);
        if (carController) {
            carController.SetLocalPlayer(true);
            this.playerCarController = carController;
        }
    }

    private spawnAI(){
        for (let index = 0; index < this.AICount; index++) {
            let spawnPoint = Tools.RandomPositionInRect(ScreenManager.instance.battleArea);
            let direction = new Vec2(Tools.RandomRange(-1,1,true), Tools.RandomRange(-1,1,true));
            const AICar = instantiate(this.AICarPrefab);
            AICar.setParent(this.node);
            AICar.setPosition(new Vec3(spawnPoint.x, spawnPoint.y));
        }
    }
    public calculatePointDiffRate(selfPoint: number, enemyPoint: number): number{
        return this.calculatePointDiff( selfPoint, enemyPoint) / 90;
    }

    public calculatePointDiff(selfPoint: number, enemyPoint: number): number{
        return (selfPoint - enemyPoint);
    }








    onDestroy() {
        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
        this.node.destroy();
        console.log("GameManager destroyed");
    }

}