import { _decorator, Component, Node, Prefab, Rect, Vec3, Vec2, instantiate } from 'cc';
import BoosterItem, { CollectibleState } from './BoosterItem';
import { Tools } from './Utils/Tools';
const { ccclass, property } = _decorator;

@ccclass('BoosterSpawner')
export class BoosterSpawner extends Component {
    // Singleton setup
    private static _instance: BoosterSpawner | null = null;
    public static get instance(): BoosterSpawner {
        if (!this._instance) {
            const node = new Node('BoosterSpawner');
            this._instance = node.addComponent(BoosterSpawner);
        }
        return this._instance;
    }

    @property(Prefab)
    boosterPrefab: Prefab = null;
    @property
    minBoosterPointGiving: number = 1;
    @property
    maxBoosterPointGiving: number = 5;
    @property
    maxPresentBoosterCount: number = 10;

    private _currentBoosterCount: number = 0;

    private boosterNodePool: Node[] = [];

    @property(Rect)
    SpawnArea: Rect = null;

    start() {
        this.createNodesAndInitData();
    }

    update(deltaTime: number) {

    }

    generateBoosterData(): BoosterItem | void {
        let newBoosterData = new BoosterItem();
        newBoosterData.boosterID = BoosterItem.nextBoosterID++;
        newBoosterData.pointGiving = Tools.RandomRange(this.minBoosterPointGiving
            , this.maxBoosterPointGiving, true);
        return newBoosterData;
    }

    reActiveBoosterNode() {
        let targetInactiveNode: Node = null;
        let targetInactiveBoosterItem: BoosterItem = null;
        if (this.getAnyInActiveBooster(targetInactiveNode, targetInactiveBoosterItem)){
            this.setNewBoosterData(targetInactiveBoosterItem);
            targetInactiveBoosterItem.setHide(false);
        }

    }

    rePositionBoosterNode(boosterNode: Node) {
        let newPos = this.getNewRandomPosition(this.SpawnArea);
        boosterNode.setPosition(new Vec3(newPos.x, newPos.y, 0));
    }

    getNewRandomPosition(rect: Rect, offsetWidth?: number, offsetHeight?: number): Vec2 {
        return Tools.RandomPositionInRect(rect, offsetWidth, offsetHeight);
    }

    createNodesAndInitData() {
        for (let index = 0; index < this.maxPresentBoosterCount; index++) {
            let newBoosterNode = instantiate(this.boosterPrefab);

            //input data
            let newBoosterItemComponent = newBoosterNode.getComponent(BoosterItem);
            this.setNewBoosterData(newBoosterItemComponent);
            //set position
            this.rePositionBoosterNode(newBoosterNode);
            //order hierachy
            this.node.addChild(newBoosterNode);
            //pooling
            this.boosterNodePool.push(newBoosterNode);
        }
    }

    getAnyInActiveBooster(outBoosterNode?: Node, outBoosterComp?: BoosterItem): boolean{
        outBoosterNode = this.boosterNodePool.find(node => node.getComponent(BoosterItem).curState == CollectibleState.Hidding);
        if (outBoosterNode) {
            outBoosterComp = outBoosterNode.getComponent(BoosterItem);
            return true;
        }
        return false;
    }

    setNewBoosterData(destinationBooster: BoosterItem){
        //generate new data and parse to destinatoin
        let newData = this.generateBoosterData();
        if (newData){
            destinationBooster.resetData(newData)
        }
    }
}


