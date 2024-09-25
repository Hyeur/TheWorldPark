import { _decorator, Component, Label, Node } from 'cc';
import { GameObject, GameObjectType } from './GameObject';
import { GameManager } from './GameManager';
import { CarController } from './CarController';
import { ConstConfig } from './Utils/ConstConfig';
const { ccclass, property } = _decorator;

@ccclass('CarStat')
export class CarStat extends Component {
    private _curPoint: number = ConstConfig.CARSTAT.DEFAUT_PARAM.startingPoint;

    private maxPoint: number = ConstConfig.CARSTAT.DEFAUT_PARAM.maxPoint;

    public get curPoint(): number{
        return this._curPoint;
    }

    pointText: Label = null;
    start() {
        this.pointText = this.node.getComponentInChildren(Label);

        //debug
        if (this.node.getComponent(CarController).isLocalPlayer)
        {
            this.changeCarPoint(10, true);
        }
    }

    update(deltaTime: number) {
    }

    changeCarPoint(value: number, roundUP: boolean) {
        let newValue = this._curPoint + value;
        
        this._curPoint = (newValue >= this.maxPoint) ? this.maxPoint : this._curPoint;

        if (newValue < 0 ){
            this._curPoint = 0;
            this.changePointText(this._curPoint, false);
            return;
        }
        
        this._curPoint += value;

        this.changePointText(this._curPoint, roundUP);
        console.log("curP: ", this._curPoint);
    }
    
    changePointText(value: number, roundUP:boolean){
        if (roundUP)
        {
            value = Math.ceil(value);
        }
        else {
            value = Math.floor(value);
        }
        this.pointText.string = value.toString();
    }
}


