import { _decorator, Component, Node, Button, UIOpacity } from 'cc';
import { CarController } from './CarController';
import { GameManager } from './GameManager';

const { ccclass, property, requireComponent, executionOrder } = _decorator;

export enum Skill { BonusSpeed, Magnet, Immortal }

enum SkillStateEnum { Invalid, Idle, Active, Cooldown }

interface SkillState {
    state: SkillStateEnum;
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
@requireComponent(GameManager)
@executionOrder(1)
export class SkillManager extends Component {
    // Singleton setup
    private static _instance: SkillManager | null = null;
    public static get instance(): SkillManager {
        if (!this._instance) {
            const node = new Node('SkillManager');
            this._instance = node.addComponent(SkillManager);
        }
        return this._instance;
    }

    // Properties
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
    private playerController: CarController | null = null;

    // Lifecycle methods
    onLoad() {
        if (SkillManager._instance) {
            this.node.destroy();
        } else {
            SkillManager._instance = this;
        }
    }

    start() {
        // Ensure GameManager is initialized
        const gameManager = GameManager.instance;
        if (!gameManager) {
            console.error('GameManager not found. SkillManager requires GameManager to be present.');
            return;
        }

        this.playerController = gameManager.playerCarController;
        this.initializeSkillStates();
        this.setupSkillButtons();
        this.initializeSkillData();
    }

    protected update(dt: number): void {

        this.updateSkills(dt);
    }

    // Initialization methods
    private initializeSkillStates() {
        const defaultState = { state: SkillStateEnum.Idle, cooldownProgress: 0 };
        this.skillStates.set(Skill.BonusSpeed, { ...defaultState, uiNode: this.bonusSpeedUI });
        this.skillStates.set(Skill.Magnet, { ...defaultState, uiNode: this.magnetUI });
        this.skillStates.set(Skill.Immortal, { ...defaultState, uiNode: this.immortalUI });
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

    // Skill management methods
    public activateSkill(skill: Skill) {
        const preset = this.getSkillPreset(skill);
        const state = this.skillStates.get(skill);
        if (!preset || state?.state !== (SkillStateEnum.Idle)) return;

        if (this.playerController) {
            state.state = SkillStateEnum.Active;
        }
    }

    private updateSkills(dt: number) {
        this.skillStates.forEach((state, skill) => {
            this.updateSkillByState(skill, dt);
            if (skill === Skill.BonusSpeed) {
                console.log("Skill State: ", state.state, "Cooldown Progress: ", state.cooldownProgress);
            }
        });

    }


    private updateSkillByState(skill: Skill, dt: number) {
        const state = this.skillStates.get(skill);
        if (!state) return;

        switch (state.state) {
            case SkillStateEnum.Invalid:
                break;
            case SkillStateEnum.Idle:
                break;
            case SkillStateEnum.Active:
                state.cooldownProgress = this.getSkillPreset(skill)?.cooldown ?? 0;
                this.playerController.connectSkill(skill);
                console.log("Skill connected: ", skill);
                state.state = SkillStateEnum.Cooldown;
                break;
            case SkillStateEnum.Cooldown:
                this.checkDisconnectedSkill(skill);
                if (state.cooldownProgress > 0) {
                    state.cooldownProgress -= dt;
                }
                else{
                    state.state = SkillStateEnum.Idle;
                    this.reActivateSkill(skill);
                    console.log("Skill ready: ", skill);
                }
                break;
        }
        this.updateSkillUI(skill);
    }

    private updateSkillUI(skill: Skill) {
        const state = this.skillStates.get(skill);
        if (!state?.uiNode) return;

        const uiOpacity = [
            state.uiNode.getComponent(UIOpacity),
            ...state.uiNode.children.map(child => child.getComponent(UIOpacity))
        ].filter(Boolean);

        const alpha = state.state == SkillStateEnum.Idle ? 255 : 100;

        const progress = state.cooldownProgress / (this.getSkillPreset(skill)?.cooldown ?? 1);
        const fillAmount = Math.max(0, Math.min(1, progress));
        uiOpacity.forEach(ui => ui.opacity = alpha);
    }

    // Utility methods
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

    public GetisSkillActivating(skill: Skill): boolean {
        return this.skillStates.get(skill)?.state === SkillStateEnum.Cooldown || false;
    }



    public GetisSkillConnected(skill: Skill): boolean {
        return this.skillStates.get(skill)?.state === SkillStateEnum.Cooldown || false;
    }

    public getSkillCooldown(skill: Skill): number {
        return this.skillStates.get(skill)?.cooldownProgress ?? 0;
    }

    public reActivateSkill(skill: Skill) {
        const state = this.skillStates.get(skill);
        if (state) {
            state.cooldownProgress = this.getSkillPreset(skill)?.cooldown ?? 0;
            console.log("Skill re-generated: ", skill);
        }
    }

    public initializeSkillData() {
        this.skillStates.forEach((state, skill) => {
            this.reActivateSkill(skill);
        });
    }


    private checkDisconnectedSkill(skill: Skill, isDisconnected?: boolean) {

        const state = this.skillStates.get(skill);
        if (this.playerController && this.playerController.getSkillRemainingDurations(skill) <= 0) {
            this.playerController.connectSkill(skill, false);
            console.log("Skill disconnected: ", skill);
            return isDisconnected = true;
        }
        return isDisconnected = false;
    }
}
