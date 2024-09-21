import { _decorator, Component, Node, Sprite, Color, Button, UIOpacity, sys } from 'cc';
import { CarController } from './CarController';
import { GameManager } from './GameManager';

const { ccclass, property } = _decorator;

export enum Skill {
    BonusSpeed,
    Magnet,
    Immortal
}

interface SkillState {
    isAvailable: boolean;
    cooldownProgress: number;
    uiNode: Node | null;
}

interface SkillPresetProperties {
    duration: number;
    cooldown: number;
    ratio?: number;
    radius?: number;
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

    @property bonusSpeedRatio: number = 1.5;
    @property bonusSpeedDurationInSeconds: number = 5;
    @property bonusSpeedCooldownInSeconds: number = 8;
    @property magnetRadius: number = 100;
    @property magnetDurationInSeconds: number = 7;
    @property magnetCooldownInSeconds: number = 12;
    @property immortalDurationInSeconds: number = 2;
    @property immortalCooldownInSeconds: number = 10;
    @property(Node) bonusSpeedUI: Node | null = null;
    @property(Node) magnetUI: Node | null = null;
    @property(Node) immortalUI: Node | null = null;

    private skillStates: Map<Skill, SkillState> = new Map();

    start() {
        this.initializeSkillStates();
        this.setupSkillButtons();
    }

    private setupSkillButtons() {
        this.setupSkillButton(this.bonusSpeedUI, Skill.BonusSpeed);
        this.setupSkillButton(this.magnetUI, Skill.Magnet);
        this.setupSkillButton(this.immortalUI, Skill.Immortal);
    }

    private setupSkillButton(node: Node | null, skill: Skill) {
        if (node) {
            const button = node.getComponent(Button) || node.addComponent(Button);
            button.node.on(Button.EventType.CLICK, () => this.activateSkill(skill), this);
        }
    }

    private initializeSkillStates() {
        this.skillStates.set(Skill.BonusSpeed, { isAvailable: true, cooldownProgress: 0, uiNode: this.bonusSpeedUI });
        this.skillStates.set(Skill.Magnet, { isAvailable: true, cooldownProgress: 0, uiNode: this.magnetUI });
        this.skillStates.set(Skill.Immortal, { isAvailable: true, cooldownProgress: 0, uiNode: this.immortalUI });
    }

    public getSkillPreset(skill: Skill): SkillPresetProperties | null {
        const presets: { [key in Skill]: SkillPresetProperties } = {
            [Skill.BonusSpeed]: {
                ratio: this.bonusSpeedRatio,
                duration: this.bonusSpeedDurationInSeconds,
                cooldown: this.bonusSpeedCooldownInSeconds
            },
            [Skill.Magnet]: {
                radius: this.magnetRadius,
                duration: this.magnetDurationInSeconds,
                cooldown: this.magnetCooldownInSeconds
            },
            [Skill.Immortal]: {
                duration: this.immortalDurationInSeconds,
                cooldown: this.immortalCooldownInSeconds
            }
        };

        return presets[skill] || null;
    }

    public activateSkill(skill: Skill) {
        const preset = this.getSkillPreset(skill);
        const state = this.skillStates.get(skill);
        if (!preset || !state?.isAvailable) return;

        const playerController = GameManager.instance.playerCarController;
        if (playerController) {
            playerController.applySkill(skill);
            state.isAvailable = false;
            state.cooldownProgress = preset.cooldown;
            this.updateSkillUI(skill);
        }
    }

    public updateSkills(dt: number) {
        this.skillStates.forEach((state, skill) => {
            if (!state.isAvailable) {
                state.cooldownProgress -= dt;
                if (state.cooldownProgress <= 0) {
                    this.reActivateSkill(skill);
                }
                this.updateSkillUI(skill);
            }
        });
    }

    private updateSkillUI(skill: Skill) {
        const state = this.skillStates.get(skill);
        if (!state?.uiNode) return;

        const uiOpacity = state.uiNode.children
            .map(child => child.getComponent(UIOpacity))
            .filter(Boolean);

        const active = state.isAvailable;

        state.uiNode.active = active;
        const alpha = active ? 255 : 102;
        const progress = state.cooldownProgress / (this.getSkillPreset(skill)?.cooldown ?? 1);

        const fillAmount = Math.max(0, Math.min(1, progress));
        uiOpacity.forEach(ui => ui.opacity = alpha);
    }

    protected update(dt: number): void {
        this.updateSkills(dt);
    }

    public isSkillActivating(skill: Skill): boolean {
        return !this.skillStates.get(skill)?.isAvailable || false;
    }

    public getSkillCooldown(skill: Skill): number {
        return this.skillStates.get(skill)?.cooldownProgress ?? 0;
    }

    public reActivateSkill(skill: Skill) {
        const state = this.skillStates.get(skill);
        if (state) {
            state.isAvailable = true;
            state.cooldownProgress = this.getSkillPreset(skill)?.cooldown ?? 0;
            this.updateSkillUI(skill);
        }
    }
}




