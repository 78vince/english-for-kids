// 語音比較實驗室（Voice Lab）：獨立頁面控制器

const KNOWN_FEMALE_VOICE_NAME_HINTS = [
  "samantha", "zira", "aria", "karen", "moira", "tessa", "victoria", "ava",
  "allison", "susan", "fiona", "kate", "serena", "grace",
  "emma", "joanna", "salli", "kimberly", "kendra", "ivy", "justine", "nicole",
  "google us english", "google uk english female", "kyoko", "sara", "linda",
  "heather", "catherine",
];

const KNOWN_MALE_VOICE_NAME_HINTS = [
  "alex", "daniel", "david", "mark", "thomas", "oliver", "aaron",
  "george", "james", "arthur", "ryan", "google uk english male", "guy",
];

// 系統（尤其 macOS / Windows）內建的老舊合成器（如 1984 年 Fred / Albert）、趣味/卡通/特效聲音
const DISALLOWED_NOVELTY_VOICE_NAMES = [
  "fred", "albert", "bad news", "bahh", "bells", "boing", "bubbles", "cellos",
  "good news", "jester", "junior", "organ", "superstar", "trinoids",
  "whisper", "zarvox", "wobble", "ralph",
  "sandy", "shelley", "flo", "eddy", "grandma", "grandpa", "rocko", "reed",
];

interface VoiceInfo {
  voice: SpeechSynthesisVoice;
  isBlacklisted: boolean;
  blacklistReason?: string;
  isWhitelisted: boolean;
  gender: "female" | "male" | "neutral";
  engine: string;
  isUs: boolean;
}

let voices: SpeechSynthesisVoice[] = [];
let voiceInfos: VoiceInfo[] = [];
let currentTab: "whitelist" | "us" | "all_en" | "blacklisted" = "whitelist";

let bennyVoiceName: string = "";
let userVoiceName: string = "";

const samplePhrases = {
  benny: "Good morning! How are you?",
  user: "Good morning! I am doing great!",
  story: "The sun is warm and bright.",
};

function isNovelty(name: string): boolean {
  const n = name.toLowerCase();
  return DISALLOWED_NOVELTY_VOICE_NAMES.some((hint) => n.includes(hint));
}

function detectGender(v: SpeechSynthesisVoice): "female" | "male" | "neutral" {
  const n = v.name.toLowerCase();
  if (n.includes("female")) return "female";
  if (n.includes("male")) return "male";
  if (KNOWN_FEMALE_VOICE_NAME_HINTS.some((h) => n.includes(h))) return "female";
  if (KNOWN_MALE_VOICE_NAME_HINTS.some((h) => n.includes(h))) return "male";
  return "neutral";
}

function detectEngine(v: SpeechSynthesisVoice): string {
  const n = v.name.toLowerCase();
  const uri = (v.voiceURI || "").toLowerCase();
  const ua = navigator.userAgent.toLowerCase();

  if (n.startsWith("google") || uri.includes("google")) return "Google Chrome";
  if (n.includes("microsoft") || uri.includes("microsoft")) return "Microsoft Windows";

  const isAppleVoice =
    n.includes("apple") ||
    uri.includes("apple") ||
    [
      "samantha",
      "alex",
      "ava",
      "allison",
      "evan",
      "nathan",
      "daniel",
      "karen",
      "fred",
      "victoria",
      "susan",
      "tom",
      "oliver",
      "serena",
      "lee",
      "veena",
      "fiona",
      "tessa",
      "moira",
      "kate",
    ].some((k) => n.includes(k));

  if (isAppleVoice || ua.includes("mac") || ua.includes("iphone") || ua.includes("ipad")) {
    return "Apple macOS (系統內建)";
  }
  if (ua.includes("windows")) return "Microsoft Windows (系統內建)";
  if (ua.includes("android")) return "Android (系統內建)";
  return "裝置系統原生";
}

function analyzeVoices(): void {
  voiceInfos = voices.map((v) => {
    const blacklisted = isNovelty(v.name);
    const langLower = v.lang.toLowerCase().replace("_", "-");
    const isUs = langLower === "en-us" || langLower.startsWith("en-us");
    const isEn = langLower.startsWith("en");
    const gender = detectGender(v);
    const engine = detectEngine(v);

    let isWhitelisted = false;
    let blacklistReason: string | undefined;

    if (blacklisted) {
      if (["fred", "albert", "ralph", "junior"].some((k) => v.name.toLowerCase().includes(k))) {
        blacklistReason = "1984 年老舊 MacinTalk 合成器，發音金屬破舊且不支援現代語速調節";
      } else {
        blacklistReason = "趣味/卡通特效合成音，帶有誇張變音或機械濾鏡";
      }
    } else if (isEn) {
      // 只要是英文且不在黑名單中，即為乾淨可用的高品質候選
      isWhitelisted = true;
    }

    return {
      voice: v,
      isBlacklisted: blacklisted,
      blacklistReason,
      isWhitelisted,
      gender,
      engine,
      isUs,
    };
  });

  // 預設為 Benny 與 使用者 挑選當前系統最佳配置（依設定：Benny = Google UK English Male, 使用者 = Google US English）
  const googleUkMale = voiceInfos.find((vi) =>
    vi.voice.name.toLowerCase().includes("google uk english male")
  );
  const googleUsFemale = voiceInfos.find((vi) =>
    vi.voice.name.toLowerCase().includes("google us")
  );

  const fallbackMale = voiceInfos.find(
    (vi) => vi.gender === "male" && !vi.isBlacklisted && vi.voice.lang.toLowerCase().startsWith("en")
  );
  const fallbackFemale = voiceInfos.find(
    (vi) => vi.gender === "female" && !vi.isBlacklisted && vi.voice.lang.toLowerCase().startsWith("en")
  );

  bennyVoiceName =
    googleUkMale?.voice.name ?? fallbackMale?.voice.name ?? voiceInfos[0]?.voice.name ?? "";
  userVoiceName =
    googleUsFemale?.voice.name ?? fallbackFemale?.voice.name ?? voiceInfos[1]?.voice.name ?? voiceInfos[0]?.voice.name ?? "";
}

function speakText(
  text: string,
  voice: SpeechSynthesisVoice,
  pitch = 1.0,
  rate = 0.95,
  volume = 1.0,
  onEnd?: () => void
): void {
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.voice = voice;
  utt.lang = voice.lang || "en-US";
  utt.pitch = pitch;
  utt.rate = rate;
  utt.volume = volume;

  utt.onend = () => onEnd?.();
  utt.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utt);
}

function renderApp(): void {
  const container = document.getElementById("voice-lab-app");
  if (!container) return;

  const whitelistCount = voiceInfos.filter((v) => v.isWhitelisted).length;
  const usCount = voiceInfos.filter((v) => v.isUs).length;
  const allEnCount = voiceInfos.filter((v) => v.voice.lang.toLowerCase().startsWith("en")).length;
  const blacklistedCount = voiceInfos.filter((v) => v.isBlacklisted).length;

  let filteredVoices = voiceInfos;
  if (currentTab === "whitelist") {
    filteredVoices = voiceInfos.filter((v) => v.isWhitelisted);
  } else if (currentTab === "us") {
    filteredVoices = voiceInfos.filter((v) => v.isUs);
  } else if (currentTab === "all_en") {
    filteredVoices = voiceInfos.filter((v) => v.voice.lang.toLowerCase().startsWith("en"));
  } else if (currentTab === "blacklisted") {
    filteredVoices = voiceInfos.filter((v) => v.isBlacklisted);
  }

  container.innerHTML = `
    <div class="lab-container">
      <header class="lab-header">
        <div class="lab-header-title">
          <span style="font-size: 1.8rem;">🎙️</span>
          <div>
            <h1>語音比較實驗室 (Voice Lab)</h1>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              本機設備共偵測到 ${voices.length} 組語音｜可即時試聽、調整音調與語速、模擬雙人對話
            </p>
          </div>
        </div>
        <a href="index.html" class="lab-back-btn">← 返回學習主站</a>
      </header>

      <!-- 雙人會話模擬試聽器 -->
      <section class="duet-panel">
        <div class="duet-panel-header">
          <h2><span>🎭</span> 雙人對話模擬試聽器（Duet Previewer）</h2>
          <span style="font-size: 0.85rem; opacity: 0.9;">測試 Benny 與 使用者 搭配時的音色與音量平衡</span>
        </div>

        <div class="duet-grid">
          <div class="duet-role-card">
            <div class="duet-role-title">🐻 角色 1：小熊 Benny（目前指派）</div>
            <select id="select-benny" class="duet-select">
              ${voiceInfos
                .filter((vi) => vi.voice.lang.toLowerCase().startsWith("en"))
                .map(
                  (vi) => `
                <option value="${vi.voice.name}" ${vi.voice.name === bennyVoiceName ? "selected" : ""}>
                  ${vi.isWhitelisted ? "🌟 " : vi.isBlacklisted ? "🚫 " : ""}${vi.voice.name} (${vi.gender === "female" ? "女聲" : vi.gender === "male" ? "男聲" : "中性"})
                </option>
              `
                )
                .join("")}
            </select>
            <div class="duet-sample-quote">"Good morning! How are you?"</div>
          </div>

          <div class="duet-role-card">
            <div class="duet-role-title">👧 角色 2：使用者回答（目前指派）</div>
            <select id="select-user" class="duet-select">
              ${voiceInfos
                .filter((vi) => vi.voice.lang.toLowerCase().startsWith("en"))
                .map(
                  (vi) => `
                <option value="${vi.voice.name}" ${vi.voice.name === userVoiceName ? "selected" : ""}>
                  ${vi.isWhitelisted ? "🌟 " : vi.isBlacklisted ? "🚫 " : ""}${vi.voice.name} (${vi.gender === "female" ? "女聲" : vi.gender === "male" ? "男聲" : "中性"})
                </option>
              `
                )
                .join("")}
            </select>
            <div class="duet-sample-quote">"Good morning! I am doing great!"</div>
          </div>
        </div>

        <div class="duet-actions">
          <button id="btn-play-duet" class="duet-play-btn">
            <span>▶️ 模擬雙人對話試聽</span>
          </button>
          <button id="btn-stop-speech" style="padding: 10px 20px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 999px; cursor: pointer; font-weight: 600;">
            ⏹️ 停止朗讀
          </button>
          <div id="duet-status" class="duet-status-text">點擊按鈕試聽雙聲道對話順序</div>
        </div>
      </section>

      <!-- 分類切換 Tabs -->
      <div class="tabs-container">
        <button class="tab-btn ${currentTab === "whitelist" ? "active" : ""}" data-tab="whitelist">
          🌟 推薦高品質白名單 <span class="tab-badge-count">${whitelistCount}</span>
        </button>
        <button class="tab-btn ${currentTab === "us" ? "active" : ""}" data-tab="us">
          🇺🇸 全部美式英語 (en-US) <span class="tab-badge-count">${usCount}</span>
        </button>
        <button class="tab-btn ${currentTab === "all_en" ? "active" : ""}" data-tab="all_en">
          🌍 全部英語語音 <span class="tab-badge-count">${allEnCount}</span>
        </button>
        <button class="tab-btn ${currentTab === "blacklisted" ? "active" : ""}" data-tab="blacklisted">
          🚫 已排除老舊/卡通音 <span class="tab-badge-count">${blacklistedCount}</span>
        </button>
      </div>

      <!-- 語音卡片列表 -->
      <div class="voice-list">
        ${
          filteredVoices.length === 0
            ? `<div class="empty-state">此分類目前無語音資料</div>`
            : filteredVoices
                .map((vi, idx) => {
                  const v = vi.voice;
                  const isBenny = v.name === bennyVoiceName;
                  const isUser = v.name === userVoiceName;

                  let genderLabel = "中性";
                  let genderClass = "tag-gender-neutral";
                  if (vi.gender === "female") {
                    genderLabel = "👩 女聲";
                    genderClass = "tag-gender-female";
                  } else if (vi.gender === "male") {
                    genderLabel = "👨 男聲";
                    genderClass = "tag-gender-male";
                  }

                  return `
            <div class="voice-card ${vi.isWhitelisted ? "is-whitelisted" : ""} ${vi.isBlacklisted ? "is-blacklisted" : ""} ${isBenny ? "is-current-benny" : ""}" data-voice-index="${idx}">
              <div class="voice-card-header">
                <div class="voice-name-row">
                  <span class="voice-name">${v.name}</span>
                  ${isBenny ? `<span class="tag tag-current-role">🐻 Benny</span>` : ""}
                  ${isUser ? `<span class="tag tag-current-role">👧 使用者</span>` : ""}
                </div>

                <div class="voice-badge-tags">
                  <span class="tag tag-lang">${v.lang}</span>
                  <span class="tag ${genderClass}">${genderLabel}</span>
                  <span class="tag tag-engine">${vi.engine}</span>
                  ${vi.isWhitelisted ? `<span class="tag tag-whitelist">🌟 高品質推薦</span>` : ""}
                  ${vi.isBlacklisted ? `<span class="tag tag-blacklist">🚫 黑名單排除</span>` : ""}
                </div>

                <div class="voice-desc">
                  ${
                    vi.isBlacklisted
                      ? `<strong style="color: var(--danger);">原因：</strong>${vi.blacklistReason}`
                      : v.name.toLowerCase().includes("samantha")
                      ? "Apple 旗艦女聲，出廠混音增益較大（聲音清晰宏亮，穿透力強），極推薦作為 Benny 發話角色。"
                      : v.name.toLowerCase().includes("google us")
                      ? "Chrome 內建高品質語音，發音溫和沉穩、音調自然，極適合作為答題朗讀。"
                      : "標準英文語音，發音流暢清晰。"
                  }
                </div>
              </div>

              <!-- 試聽操作 -->
              <div class="test-section">
                <span class="test-label">快速情境試聽：</span>
                <div class="sample-btns">
                  <button class="sample-btn" data-voice="${v.name}" data-phrase="${samplePhrases.benny}">🐻 問候句</button>
                  <button class="sample-btn" data-voice="${v.name}" data-phrase="${samplePhrases.user}">👧 回答句</button>
                  <button class="sample-btn" data-voice="${v.name}" data-phrase="${samplePhrases.story}">📖 短文章節</button>
                </div>

                <div class="custom-input-row">
                  <input type="text" class="custom-input" placeholder="輸入自訂英文句子試聽..." value="Hello! Nice to meet you." />
                  <button class="custom-speak-btn" data-voice="${v.name}">🔊 播放</button>
                </div>
              </div>

              <!-- 調音滑桿 -->
              <div class="sliders-grid">
                <div class="slider-group">
                  <div class="slider-header">
                    <span>音調 Pitch</span>
                    <span class="pitch-val">1.0</span>
                  </div>
                  <input type="range" class="slider-pitch" min="0.8" max="1.3" step="0.02" value="1.0" />
                </div>
                <div class="slider-group">
                  <div class="slider-header">
                    <span>語速 Rate</span>
                    <span class="rate-val">0.95</span>
                  </div>
                  <input type="range" class="slider-rate" min="0.5" max="1.4" step="0.05" value="0.95" />
                </div>
              </div>

              <!-- 底部指派 -->
              <div class="card-actions">
                <button class="assign-role-btn" data-assign-role="benny" data-voice="${v.name}">設為 Benny 🐻</button>
                <button class="assign-role-btn" data-assign-role="user" data-voice="${v.name}">設為 使用者 👧</button>
              </div>
            </div>
          `;
                })
                .join("")
        }
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents(): void {
  // Tab 切換
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLElement;
      currentTab = target.dataset.tab as any;
      renderApp();
    });
  });

  // 雙人對話角色切換
  const bennySelect = document.getElementById("select-benny") as HTMLSelectElement | null;
  bennySelect?.addEventListener("change", (e) => {
    bennyVoiceName = (e.target as HTMLSelectElement).value;
    renderApp();
  });

  const userSelect = document.getElementById("select-user") as HTMLSelectElement | null;
  userSelect?.addEventListener("change", (e) => {
    userVoiceName = (e.target as HTMLSelectElement).value;
    renderApp();
  });

  // 停止朗讀
  document.getElementById("btn-stop-speech")?.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    const status = document.getElementById("duet-status");
    if (status) status.textContent = "已停止朗讀";
  });

  // 雙人對話模擬
  document.getElementById("btn-play-duet")?.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    const bennyV = voices.find((v) => v.name === bennyVoiceName);
    const userV = voices.find((v) => v.name === userVoiceName);
    const status = document.getElementById("duet-status");

    if (!bennyV || !userV) {
      if (status) status.textContent = "請先選擇兩位角色的語音！";
      return;
    }

    if (status) status.textContent = `🐻 小熊 Benny (${bennyV.name}) 朗讀中...`;

    // 1. 播放 Benny 的台詞
    speakText(samplePhrases.benny, bennyV, 1.0, 0.95, 1.0, () => {
      if (status) status.textContent = `⏳ 停頓 350ms (真人自然反應)...`;
      setTimeout(() => {
        if (status) status.textContent = `👧 使用者回答 (${userV.name}) 朗讀中...`;
        // 2. 播放使用者回答的台詞
        speakText(samplePhrases.user, userV, 1.0, 0.95, 1.0, () => {
          if (status) status.textContent = `✅ 雙人對話模擬播放完畢！`;
        });
      }, 350);
    });
  });

  // 快捷試聽按鈕
  document.querySelectorAll(".sample-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLElement;
      const vName = target.dataset.voice;
      const phrase = target.dataset.phrase;
      const card = target.closest(".voice-card");
      if (!vName || !phrase || !card) return;

      const pitch = parseFloat((card.querySelector(".slider-pitch") as HTMLInputElement).value);
      const rate = parseFloat((card.querySelector(".slider-rate") as HTMLInputElement).value);
      const voice = voices.find((v) => v.name === vName);
      if (voice) speakText(phrase, voice, pitch, rate);
    });
  });

  // 自訂句子試聽
  document.querySelectorAll(".custom-speak-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLElement;
      const vName = target.dataset.voice;
      const card = target.closest(".voice-card");
      if (!vName || !card) return;

      const text = (card.querySelector(".custom-input") as HTMLInputElement).value.trim() || "Hello!";
      const pitch = parseFloat((card.querySelector(".slider-pitch") as HTMLInputElement).value);
      const rate = parseFloat((card.querySelector(".slider-rate") as HTMLInputElement).value);
      const voice = voices.find((v) => v.name === vName);
      if (voice) speakText(text, voice, pitch, rate);
    });
  });

  // 滑桿連動數值顯示
  document.querySelectorAll(".slider-pitch").forEach((slider) => {
    slider.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const valSpan = target.closest(".slider-group")?.querySelector(".pitch-val");
      if (valSpan) valSpan.textContent = parseFloat(target.value).toFixed(2);
    });
  });

  document.querySelectorAll(".slider-rate").forEach((slider) => {
    slider.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const valSpan = target.closest(".slider-group")?.querySelector(".rate-val");
      if (valSpan) valSpan.textContent = parseFloat(target.value).toFixed(2);
    });
  });

  // 指派角色按鈕
  document.querySelectorAll(".assign-role-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLElement;
      const role = target.dataset.assignRole;
      const vName = target.dataset.voice;
      if (!role || !vName) return;

      if (role === "benny") {
        bennyVoiceName = vName;
      } else {
        userVoiceName = vName;
      }
      renderApp();

      // 平滑滾動到頂部模擬器
      document.querySelector(".duet-panel")?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

function init(): void {
  function load() {
    voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      analyzeVoices();
      renderApp();
    }
  }

  load();
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = load;
  }
}

init();
