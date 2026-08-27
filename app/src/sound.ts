// 音效——「答對／答錯」即時回饋，跟「這一輪題型全部完成」時播放的簡短音效。
// 用的是真的音檔（合成產生的 WAV，不是遊戲當下即時用 Web Audio API 產生的音波），
// 跟 avatars.ts 一樣透過 Vite 的資源匯入機制在建置時期打包，不需要額外的網路請求。
//
// 播放用 HTMLAudioElement 而不是共用同一個 <audio> 節點：每次播放都 new 一個，
// 這樣像配對遊戲快速連續答對時，聲音可以疊在一起播放，不會被前一個音效打斷或蓋掉。

import correctSoundUrl from "./assets/sfx/correct.wav?url";
import wrongSoundUrl from "./assets/sfx/wrong.wav?url";
import roundCompleteSoundUrl from "./assets/sfx/round-complete.wav?url";
import favoriteSoundUrl from "./assets/sfx/favorite.wav?url";
import unfavoriteSoundUrl from "./assets/sfx/unfavorite.wav?url";

function playSound(url: string, volume: number): void {
  try {
    const audio = new Audio(url);
    audio.volume = volume;
    // 瀏覽器的自動播放限制在「使用者剛互動過（點擊卡片/選項）」的情境下通常不會擋，
    // 但保險起見還是把 play() 回傳的 Promise 接起來，播放失敗就安靜忽略——
    // 音效只是加分的回饋，不該因為某些瀏覽器環境擋自動播放就讓遊戲報錯。
    void audio.play().catch(() => {});
  } catch {
    // 忽略（例如測試環境沒有 Audio 建構子），音效播不出來不該讓遊戲掛掉。
  }
}

/** 答對當下播放：清脆上揚的兩音「叮鈴」 */
export function playCorrectSound(): void {
  playSound(correctSoundUrl, 0.28);
}

/** 答錯當下播放：低沉柔和的兩音提示（刻意不做成刺耳警報聲，畢竟是給小朋友用） */
export function playWrongSound(): void {
  playSound(wrongSoundUrl, 0.22);
}

/** 一輪題型全部答完時播放：歡快的上升琶音，模擬簡單的歡呼慶祝感 */
export function playRoundCompleteSound(): void {
  playSound(roundCompleteSoundUrl, 0.32);
}

/** 收藏單字當下播放：三個快速上升的高音「亮晶晶」音效（像收集寶物），
 * 跟 playCorrectSound() 的兩音叮鈴不同——音域更高、多一個音、帶更多泛音，
 * 讓「收藏」這個動作有自己獨立的辨識度，不會跟答對的音效搞混。 */
export function playFavoriteSound(): void {
  playSound(favoriteSoundUrl, 0.3);
}

/** 取消收藏當下播放：單一音符輕輕往下滑音，短促、音域中高、不低沉——
 * 刻意跟 playWrongSound() 拉開距離，因為取消收藏是使用者自己的選擇，
 * 不是「答錯」，音效不該帶警示或負面的感覺。 */
export function playUnfavoriteSound(): void {
  playSound(unfavoriteSoundUrl, 0.24);
}
