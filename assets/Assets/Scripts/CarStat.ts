import { _decorator, Component, Label, Node } from 'cc';
import { GameObject, GameObjectType } from './GameObject';
const { ccclass, property } = _decorator;

@ccclass('CarStat')
export class CarStat extends Component {
    private _curPoint: number = 10;

    public get curPoint(): number{
        return this._curPoint;
    }

    pointText: Label = null;
    start() {
        this.pointText = this.node.getComponentInChildren(Label);

    }

    update(deltaTime: number) {
    }

    changeCarPoint(value: number) {
        this._curPoint += value;
        this.pointText.string = this._curPoint.toString();
    }
}


