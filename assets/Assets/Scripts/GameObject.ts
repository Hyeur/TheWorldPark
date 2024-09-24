import { _decorator, Component, Node, Enum } from 'cc';
const { ccclass, property } = _decorator;

export enum GameObjectType {
    Unknown,
    Player,
    Enemy,
    Collectible,
    Bounds,
    MagnetSkillRange,

    PointLabel
}

Enum(GameObjectType);

@ccclass('GameObject')
export class GameObject extends Component {
    @property({ type: GameObjectType })
    objectType: GameObjectType = GameObjectType.Unknown;
    
    public GetTypeAsString( ) {
        return GameObjectType[this.objectType];
    }

    start() {

    }
}


