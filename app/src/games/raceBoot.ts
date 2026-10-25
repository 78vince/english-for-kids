// 賽跑進入點：先跟區網電腦對帳（hydrate，見 storage.ts），再載入賽跑頁。
import { bootThen } from "../storage";
import { guardGamePage } from "../gameRelease";

// 上架閘門：games.json 的 status 不是 active（且不在遊戲實驗室）就直接回遊戲室，不載入遊戲
if (guardGamePage("race")) bootThen(() => import("./race"));
