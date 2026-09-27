// Stage E 會話練習（Conversation Practice）遊戲引擎
// 負責管理角色對話輪播、使用者 3 選 1 回答、選錯溫和引導重選、情境轉場換圖與歷史對話紀錄。

import type {
  Conversation,
  ConversationOption,
  ConversationScene,
  ConversationTurn,
} from "./types";

export interface ChatMessage {
  id: string;
  speaker: "character" | "user";
  en: string;
  zh: string;
  avatar?: string;
  name?: string;
}

export interface ConversationOptionState {
  option: ConversationOption;
  status: "idle" | "wrong" | "correct";
}

export class ConversationGame {
  private turnIndex = 0;
  private locked = false;

  history: ChatMessage[] = [];
  optionStates: ConversationOptionState[] = [];
  currentHint: string | null = null;
  correctCount = 0;
  wrongCount = 0;

  onChange: () => void = () => {};
  onCorrect: () => void = () => {};
  onWrong: () => void = () => {};
  onSceneChange: (scene: ConversationScene) => void = () => {};
  onComplete: () => void = () => {};

  /** 局部 DOM 更新專用事件：答錯（不重繪全頁） */
  onOptionWrong?: (optionId: string, hint: string) => void;
  /** 局部 DOM 更新專用事件：答對（追加使用者氣泡，isFinished 標記是否所有回合結束） */
  onOptionCorrect?: (
    optState: ConversationOptionState,
    userMsg: ChatMessage,
    isFinished: boolean
  ) => void;
  /** 局部 DOM 更新專用事件：前進到下一回合（追加角色氣泡、更新按鈕、換景） */
  onTurnAdvanced?: (
    nextTurn: ConversationTurn,
    charMsg: ChatMessage,
    nextScene: ConversationScene,
    sceneChanged: boolean
  ) => void;

  constructor(public readonly conversation: Conversation) {
    if (!conversation.turns || conversation.turns.length === 0) {
      throw new Error(`會話 "${conversation.id}" 沒有對話內容（turns 是空的）`);
    }
    this.initTurn();
  }

  get currentTurn(): ConversationTurn | null {
    if (this.isCompleted) return null;
    return this.conversation.turns[this.turnIndex] ?? null;
  }

  get currentTurnNumber(): number {
    return Math.min(this.turnIndex + 1, this.totalTurns);
  }

  get totalTurns(): number {
    return this.conversation.turns.length;
  }

  get isCompleted(): boolean {
    return this.turnIndex >= this.conversation.turns.length;
  }

  get currentScene(): ConversationScene {
    const sceneId = this.currentTurn?.scene_id || this.conversation.scenes[0]?.scene_id;
    const found = this.conversation.scenes.find((s) => s.scene_id === sceneId);
    return found || this.conversation.scenes[0];
  }

  private initTurn(): void {
    const turn = this.currentTurn;
    if (!turn) return;

    // 將角色的發言加入歷史紀錄（若尚未加入）
    const charMsgId = `turn-${turn.turn_id}-char`;
    if (!this.history.some((m) => m.id === charMsgId)) {
      this.history.push({
        id: charMsgId,
        speaker: "character",
        en: turn.character_line.en,
        zh: turn.character_line.zh,
        avatar: this.conversation.character.avatar,
        name: this.conversation.character.name,
      });
    }

    // 載入該回合選項（隨機打散，保持趣味與挑戰性）
    const shuffled = [...turn.options].sort(() => Math.random() - 0.5);
    this.optionStates = shuffled.map((opt) => ({
      option: opt,
      status: "idle",
    }));
    this.currentHint = null;
    this.locked = false;
  }

  /** 使用者點選某個選項 */
  choose(optionId: string): boolean {
    if (this.locked || this.isCompleted) return false;

    const optState = this.optionStates.find((o) => o.option.id === optionId);
    if (!optState || optState.status === "wrong") return false;

    if (!optState.option.is_correct) {
      // 答錯：溫和引導重選，不挫折
      optState.status = "wrong";
      this.wrongCount++;
      this.currentHint =
        optState.option.hint || "Almost! Listen carefully and try another one!";
      this.onWrong();
      if (this.onOptionWrong) {
        this.onOptionWrong(optionId, this.currentHint);
      } else {
        this.onChange();
      }
      return false;
    }

    // 答對：推進對話
    this.locked = true;
    optState.status = "correct";
    this.correctCount++;
    this.currentHint = null;

    // 加入使用者的回答氣泡
    const turn = this.currentTurn!;
    const userMsg: ChatMessage = {
      id: `turn-${turn.turn_id}-user`,
      speaker: "user",
      en: optState.option.en,
      zh: optState.option.zh,
      name: "You",
    };
    this.history.push(userMsg);

    this.onCorrect();
    this.turnIndex++;
    const finished = this.isCompleted;

    if (this.onOptionCorrect) {
      this.onOptionCorrect(optState, userMsg, finished);
    } else {
      if (finished) {
        this.onComplete();
        this.onChange();
      } else {
        setTimeout(() => this.advanceTurn(), 1200);
      }
    }

    return true;
  }

  /** 前進至下一回合（由外部在使用者發音完整結束後主動呼叫，避免語音重疊被中斷） */
  advanceTurn(): void {
    if (this.isCompleted) return;

    const prevTurn = this.conversation.turns[this.turnIndex - 1];
    const prevSceneId = prevTurn ? prevTurn.scene_id : null;
    const nextTurn = this.currentTurn;
    if (!nextTurn) return;

    this.initTurn();
    const sceneChanged = nextTurn.scene_id !== prevSceneId;
    const nextScene =
      this.conversation.scenes.find((s) => s.scene_id === nextTurn.scene_id) ||
      this.conversation.scenes[0];

    if (sceneChanged) {
      this.onSceneChange(nextScene);
    }

    const charMsg = this.history.find((m) => m.id === `turn-${nextTurn.turn_id}-char`)!;
    if (this.onTurnAdvanced) {
      this.onTurnAdvanced(nextTurn, charMsg, nextScene, sceneChanged);
    } else {
      this.onChange();
    }
  }
}
