import { _decorator, Component, Node, Sprite, Color } from 'cc';

const { ccclass, property } = _decorator;

export enum Skill {
    BonusSpeed,
    Magnet,
    Immortal
}

interface SkillState {
    isActive: boolean;
    remainingDuration: number;
    uiNode: Node | null;
}

@ccclass('SkillManager')
export class SkillManager extends Component {
    private static _instance: SkillManager | null = null;
    
    public static get instance(): SkillManager {
        if (!this._instance) {
            const node = new Node('SkillManager');
            this._instance = node.addComponent(SkillManager);
        }
        return this._instance;
    }

    onLoad() {
        if (SkillManager._instance) {
            this.node.destroy();
        } else {
            SkillManager._instance = this;
        }
    }

    @property
    bonusSpeedRatio: number = 1.5;

    @property
    bonusSpeedDuration: number = 5;

    @property
    magnetRadius: number = 100;

    @property
    magnetDuration: number = 7;

    @property
    immortalDuration: number = 3;

    @property(Node)
    bonusSpeedUI: Node | null = null;

    @property(Node)
    magnetUI: Node | null = null;

    @property(Node)
    immortalUI: Node | null = null;

    private skillStates: Map<Skill, SkillState> = new Map();

    start() {
        this.initializeSkillStates();
    }

    private initializeSkillStates() {
        this.skillStates.set(Skill.BonusSpeed, { isActive: false, remainingDuration: 0, uiNode: this.bonusSpeedUI });
        this.skillStates.set(Skill.Magnet, { isActive: false, remainingDuration: 0, uiNode: this.magnetUI });
        this.skillStates.set(Skill.Immortal, { isActive: false, remainingDuration: 0, uiNode: this.immortalUI });
    }

    public getSkillPreset(skill: Skill): any {
        switch (skill) {
            case Skill.BonusSpeed:
                return {
                    ratio: this.bonusSpeedRatio,
                    duration: this.bonusSpeedDuration
                };
            case Skill.Magnet:
                return {
                    radius: this.magnetRadius,
                    duration: this.magnetDuration
                };
            case Skill.Immortal:
                return {
                    duration: this.immortalDuration
                };
            default:
                console.warn(`Skill preset not found for ${skill}`);
                return null;
        }
    }

    public activateSkill(skill: Skill) {
        const preset = this.getSkillPreset(skill);
        if (preset) {
            const state = this.skillStates.get(skill);
            if (state) {
                state.isActive = true;
                state.remainingDuration = preset.duration;
                this.updateSkillUI(skill, true);
            }
        }
    }

    public updateSkills(dt: number) {
        this.skillStates.forEach((state, skill) => {
            if (state.isActive) {
                state.remainingDuration -= dt;
                if (state.remainingDuration <= 0) {
                    state.isActive = false;
                    state.remainingDuration = 0;
                    this.updateSkillUI(skill, false);
                } else {
                    this.updateSkillUI(skill, true, state.remainingDuration);
                }
            }
        });
    }

    private updateSkillUI(skill: Skill, isActive: boolean, remainingDuration?: number) {
        const state = this.skillStates.get(skill);
        if (state && state.uiNode) {
            const sprite = state.uiNode.getComponent(Sprite);
            if (sprite) {
                sprite.color = new Color(1, 1, 1, isActive ? 1 : 0.4);
            }
            // You can add more UI updates here, such as updating a progress bar
            // or displaying the remaining duration
        }
    }

    public isSkillActive(skill: Skill): boolean {
        const state = this.skillStates.get(skill);
        return state ? state.isActive : false;
    }

    public getSkillRemainingDuration(skill: Skill): number {
        const state = this.skillStates.get(skill);
        return state ? state.remainingDuration : 0;
    }
}


