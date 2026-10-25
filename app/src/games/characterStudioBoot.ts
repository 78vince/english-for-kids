// 角色工作室進入點：先跟區網電腦對帳（hydrate，見 storage.ts），再載入工作室。
import { bootThen } from "../storage";

bootThen(() => import("./characterStudio"));
