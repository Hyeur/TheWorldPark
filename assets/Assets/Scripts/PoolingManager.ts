import { _decorator, Component, Node } from 'cc';
import BoosterItem from './BoosterItem';
const { ccclass, property } = _decorator;

@ccclass('PoolingManager')
export class PoolingManager extends Component {
    private static _instance: PoolingManager | null = null;

    public static get instance(): PoolingManager {
        if (!this._instance) {
            throw new Error('PoolingManager is not initialized');
        }
        return this._instance;
    }

    ///////Booster//////////
    private boosterPool: BoosterItem[] = [];

    @property
    minBoosterPointGiving: number = 1;
    @property
    maxBoosterPointGiving: number = 5;

    ///////AI//////////
    private AIcarPool: string[];
    start() {
        this.initializePool();
    }

    update(deltaTime: number) {
        
    }
    private initializePool() {
        this.initBoosterPool();
        this.initAICarPool();
    }

    private initBoosterPool() {
        

    }

    private initAICarPool() {
        // Add items to the pool
        this.AIcarPool.push("Coin");
        this.AIcarPool.push("PowerUp");
        this.AIcarPool.push("HealthPack");
    }

    public spawnRandomItem() {
        
    }
}

