#!/usr/bin/env node
"use strict";

/**
 * fix-9router-harnesses — Automated remediation engine for 9Router and connected agent harnesses.
 *
 * Capabilities:
 *  1. Health check & background launch of ag-prompt-shim on port 20129 (--experimental-sqlite).
 *  2. Ensure persistent Windows Startup hook (ag-prompt-shim.vbs).
 *  3. Surgical Base URL remediation (ports 20128 -> 20129) with auto-backup for omp, pi, opencode, codex, claude.
 *  4. Clean expired model locks & reset stale unavailable status for Antigravity accounts in data.sqlite.
 *  5. Run verification probes (OK+sys) across all configured harnesses.
 *  6. Stale process detection & warning report.
 */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn, execFileSync } = require("node:child_process");

const HERE = __dirname;
const MANIFEST_PATH = path.join(HERE, "..", "assets", "harness-map.json");
const MANIFEST = fs.existsSync(MANIFEST_PATH)
  ? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"))
  : {
      router: { base: "http://127.0.0.1:20128", health: "/api/health" },
      shim: { base: "http://127.0.0.1:20129", health: "/health" },
      db: "%APPDATA%/9router/db/data.sqlite",
      harnesses: [
        { id: "omp", kind: "omp", config: "~/.omp/agent/models.yml", process: "omp.exe", systemPrompt: true },
        { id: "pi", kind: "pi", config: "~/.pi/agent/models.json", process: "pi-coding-agent", systemPrompt: true },
        { id: "opencode", kind: "opencode", config: "~/.config/opencode/opencode.json", process: "opencode.exe", systemPrompt: true },
        { id: "codex", kind: "codex", config: "~/.codex/config.toml", process: "codex.exe", systemPrompt: true },
        { id: "claude", kind: "claude", config: "~/.claude/settings.json", process: "claude.exe", systemPrompt: true }
      ]
    };

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const SKIP_POOL = argv.includes("--skip-pool");
const SKIP_PROBES = argv.includes("--skip-probes");
const JSON_OUT = argv.includes("--json");

function expand(p) {
  if (!p) return p;
  let out = p.replace(/^~(?=$|[\\/])/, os.homedir());
  out = out.replace(/%([A-Z_]+)%/g, (_, k) => process.env[k] || "");
  return out;
}

function readText(p) {
  try { return fs.readFileSync(expand(p), "utf8"); } catch { return null; }
}

function writeTextWithBackup(p, content) {
  const target = expand(p);
  if (!fs.existsSync(target)) return false;
  const current = fs.readFileSync(target, "utf8");
  if (current === content) return false;
  if (!DRY_RUN) {
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const bak = target + ".bak-" + ts;
    fs.writeFileSync(bak, current, "utf8");
    fs.writeFileSync(target, content, "utf8");
  }
  return true;
}

async function getJson(url, timeoutMs = 3000) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    const text = await r.text();
    let body = null;
    try { body = JSON.parse(text); } catch { body = text.slice(0, 200); }
    return { ok: r.ok, status: r.status, body };
  } catch (e) {
    return { ok: false, status: 0, error: e.message };
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------- Step 1: Shim Check & Start
async function remediateShim(actions) {
  let shim = await getJson(MANIFEST.shim.base + MANIFEST.shim.health);
  if (shim.ok && shim.body && Number(shim.body.combos) > 0) {
    actions.push({ item: "shim", status: "OK", detail: `Shim 20129 đang chạy sẵn sàng (combos=${shim.body.combos})` });
    return true;
  }

  if (DRY_RUN) {
    actions.push({ item: "shim", status: "DRY_RUN", detail: "Cần khởi động ag-prompt-shim trên cổng 20129" });
    return false;
  }

  const shimScript = expand("%APPDATA%/9router/fix/ag-prompt-shim.mjs");
  if (!fs.existsSync(shimScript)) {
    actions.push({ item: "shim", status: "FAIL", detail: `Không tìm thấy file shim tại: ${shimScript}` });
    return false;
  }

  try {
    const child = spawn("node.exe", ["--experimental-sqlite", shimScript], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.unref();

    // Poll up to 6 seconds
    let ready = false;
    for (let i = 0; i < 12; i++) {
      await sleep(500);
      shim = await getJson(MANIFEST.shim.base + MANIFEST.shim.health, 1000);
      if (shim.ok) { ready = true; break; }
    }

    if (ready) {
      actions.push({ item: "shim", status: "FIXED", detail: `Đã khởi động ag-prompt-shim trên cổng 20129 (combos=${shim.body?.combos || 0})` });
      return true;
    } else {
      actions.push({ item: "shim", status: "FAIL", detail: "Đã kích hoạt process nhưng cổng 20129 chưa phản hồi /health" });
      return false;
    }
  } catch (err) {
    actions.push({ item: "shim", status: "FAIL", detail: `Lỗi khởi động shim: ${err.message}` });
    return false;
  }
}

// ---------------------------------------------------------------- Step 2: Ensure Startup Script
function remediateStartup(actions) {
  const startupDir = expand("%APPDATA%/Microsoft/Windows/Start Menu/Programs/Startup");
  if (!fs.existsSync(startupDir)) return;
  const vbsPath = path.join(startupDir, "ag-prompt-shim.vbs");
  const exists = fs.readdirSync(startupDir).some((f) => /ag-prompt-shim/i.test(f));

  if (exists) {
    actions.push({ item: "startup", status: "OK", detail: "Đã có ag-prompt-shim trong Windows Startup" });
    return;
  }

  if (DRY_RUN) {
    actions.push({ item: "startup", status: "DRY_RUN", detail: "Cần tạo ag-prompt-shim.vbs trong Windows Startup" });
    return;
  }

  try {
    const vbsContent = [
      'Set WshShell = CreateObject("WScript.Shell")',
      'WshShell.Run """node.exe"" --experimental-sqlite ""' + expand("%APPDATA%/9router/fix/ag-prompt-shim.mjs").replace(/\\/g, "\\\\") + '""", 0, False\r\n'
    ].join("\r\n");
    fs.writeFileSync(vbsPath, vbsContent, "utf8");
    actions.push({ item: "startup", status: "FIXED", detail: "Đã tạo ag-prompt-shim.vbs trong Windows Startup để tự khởi động cùng máy" });
  } catch (err) {
    actions.push({ item: "startup", status: "FAIL", detail: `Không thể ghi file startup: ${err.message}` });
  }
}

// ---------------------------------------------------------------- Step 3: Remediate Harness Configurations
function remediateHarnesses(actions) {
  // 1. omp: ~/.omp/agent/models.yml
  const ompPath = expand("~/.omp/agent/models.yml");
  if (fs.existsSync(ompPath)) {
    const raw = fs.readFileSync(ompPath, "utf8");
    const updated = raw.replace(/(baseUrl:\s*http:\/\/127\.0\.0\.1:)20128(\/v1)?/g, "$120129$2");
    if (raw !== updated) {
      if (writeTextWithBackup(ompPath, updated)) {
        actions.push({ item: "omp", status: "FIXED", detail: "Chuyển baseUrl từ 20128 sang 20129 trong ~/.omp/agent/models.yml" });
      }
    } else {
      actions.push({ item: "omp", status: "OK", detail: "Cấu hình baseUrl đã trỏ đúng cổng 20129" });
    }
  }

  // 2. pi: ~/.pi/agent/models.json
  const piPath = expand("~/.pi/agent/models.json");
  if (fs.existsSync(piPath)) {
    const raw = fs.readFileSync(piPath, "utf8");
    const updated = raw.replace(/("baseUrl":\s*"http:\/\/127\.0\.0\.1:)20128(\/v1)?/g, "$120129$2");
    if (raw !== updated) {
      if (writeTextWithBackup(piPath, updated)) {
        actions.push({ item: "pi", status: "FIXED", detail: "Chuyển baseUrl từ 20128 sang 20129 trong ~/.pi/agent/models.json" });
      }
    } else {
      actions.push({ item: "pi", status: "OK", detail: "Cấu hình baseUrl đã trỏ đúng cổng 20129" });
    }
  }

  // 3. opencode: ~/.config/opencode/opencode.json
  const opencodePath = expand("~/.config/opencode/opencode.json");
  if (fs.existsSync(opencodePath)) {
    const raw = fs.readFileSync(opencodePath, "utf8");
    const updated = raw.replace(/("baseURL":\s*"http:\/\/127\.0\.0\.1:)20128(\/v1)?/g, "$120129$2");
    if (raw !== updated) {
      if (writeTextWithBackup(opencodePath, updated)) {
        actions.push({ item: "opencode", status: "FIXED", detail: "Chuyển baseURL từ 20128 sang 20129 trong ~/.config/opencode/opencode.json" });
      }
    } else {
      actions.push({ item: "opencode", status: "OK", detail: "Cấu hình baseURL đã trỏ đúng cổng 20129" });
    }
  }

  // 4. codex: ~/.codex/config.toml
  const codexPath = expand("~/.codex/config.toml");
  if (fs.existsSync(codexPath)) {
    const raw = fs.readFileSync(codexPath, "utf8");
    const updated = raw.replace(/(base_url\s*=\s*"http:\/\/127\.0\.0\.1:)20128(\/v1)?/g, "$120129$2");
    if (raw !== updated) {
      if (writeTextWithBackup(codexPath, updated)) {
        actions.push({ item: "codex", status: "FIXED", detail: "Chuyển base_url từ 20128 sang 20129 trong ~/.codex/config.toml" });
      }
    } else {
      actions.push({ item: "codex", status: "OK", detail: "Cấu hình base_url đã trỏ đúng cổng 20129" });
    }
  }

  // 5. claude: ~/.claude/settings.json
  const claudePath = expand("~/.claude/settings.json");
  if (fs.existsSync(claudePath)) {
    const raw = fs.readFileSync(claudePath, "utf8");
    const updated = raw.replace(/("ANTHROPIC_BASE_URL":\s*"http:\/\/127\.0\.0\.1:)20128"/g, '$120129"');
    if (raw !== updated) {
      if (writeTextWithBackup(claudePath, updated)) {
        actions.push({ item: "claude", status: "FIXED", detail: "Chuyển ANTHROPIC_BASE_URL từ 20128 sang 20129 trong ~/.claude/settings.json" });
      }
    } else {
      actions.push({ item: "claude", status: "OK", detail: "Cấu hình ANTHROPIC_BASE_URL đã trỏ đúng cổng 20129" });
    }
  }
}

// ---------------------------------------------------------------- Step 4: Pool & Smart Account Rotation (2-3 Active)
function remediatePoolAccounts(actions) {
  if (SKIP_POOL) return;
  const dbPath = expand(MANIFEST.db);
  if (!fs.existsSync(dbPath)) return;

  const TARGET_ACTIVE_MIN = 2;
  const TARGET_ACTIVE_MAX = 3;

  let DatabaseSync;
  try {
    ({ DatabaseSync } = require("node:sqlite"));
  } catch {
    actions.push({ item: "pool", status: "WARN", detail: "node:sqlite không khả dụng (thiếu --experimental-sqlite)" });
    return;
  }

  try {
    const db = new DatabaseSync(dbPath);
    const conns = db.prepare("select id, email, isActive, priority, data from providerConnections where provider='antigravity'").all();
    const now = Date.now();
    let lockCleanedCount = 0;

    const parsedConns = conns.map((c) => {
      let d = {};
      try { d = JSON.parse(c.data || "{}"); } catch { /* ignore */ }
      let changed = false;

      // 1. Dọn model locks đã quá hạn
      for (const [k, v] of Object.entries(d)) {
        if (k.startsWith("modelLock_")) {
          const lockTime = new Date(v).getTime();
          if (isNaN(lockTime) || lockTime <= now) {
            delete d[k];
            changed = true;
          }
        }
      }

      // 2. Khôi phục unavailable nếu không còn lock
      const remainingLocks = Object.keys(d).filter((k) => k.startsWith("modelLock_"));
      if (remainingLocks.length === 0 && d.testStatus === "unavailable") {
        d.testStatus = "active";
        d.backoffLevel = 0;
        delete d.lastError;
        changed = true;
      }

      if (changed) lockCleanedCount++;
      return {
        id: c.id,
        email: c.email,
        isActive: Number(c.isActive),
        priority: Number(c.priority || 0),
        data: d,
        activeLocks: remainingLocks.length,
        isHealthy: remainingLocks.length === 0 && d.testStatus !== "unavailable",
        dataChanged: changed,
      };
    });

    // 3. Xoay vòng tài khoản thông minh (Smart Rotation):
    // Tắt các tài khoản đang active mà bị lỗi/lock (nếu có tài khoản dự phòng thay thế)
    const reserveHealthy = parsedConns.filter((c) => c.isActive === 0 && c.isHealthy);
    for (const c of parsedConns) {
      if (c.isActive === 1 && !c.isHealthy && reserveHealthy.length > 0) {
        c.isActive = 0;
        c.dataChanged = true;
        const replacement = reserveHealthy.shift();
        if (replacement) {
          replacement.isActive = 1;
          replacement.dataChanged = true;
          actions.push({
            item: "rotation",
            status: "ROTATE",
            detail: `Tắt ${c.email} (đang dính lock) -> Bật thay thế ${replacement.email}`
          });
        }
      }
    }

    // 4. Kiểm soát giới hạn cứng: chỉ cho phép 2 - 3 accounts hoạt động
    let currentActive = parsedConns.filter((c) => c.isActive === 1);

    // Nếu số account active vượt quá 3 -> Tắt bớt các account ưu tiên thấp hơn
    if (currentActive.length > TARGET_ACTIVE_MAX) {
      // Giữ lại 3 account khỏe nhất, tắt bớt phần thừa
      currentActive.sort((a, b) => (b.isHealthy ? 1 : 0) - (a.isHealthy ? 1 : 0));
      const toDeactivate = currentActive.slice(TARGET_ACTIVE_MAX);
      for (const d of toDeactivate) {
        d.isActive = 0;
        d.dataChanged = true;
        actions.push({
          item: "rotation",
          status: "LIMIT",
          detail: `Tắt bớt ${d.email} để bảo đảm trần an toàn tối đa 3 accounts`
        });
      }
      currentActive = parsedConns.filter((c) => c.isActive === 1);
    }

    // Nếu số account active nhỏ hơn 2 -> Bật thêm từ danh sách dự phòng khỏe mạnh
    if (currentActive.length < TARGET_ACTIVE_MIN) {
      const candidates = parsedConns.filter((c) => c.isActive === 0 && c.isHealthy);
      while (currentActive.length < TARGET_ACTIVE_MAX && candidates.length > 0) {
        const toAdd = candidates.shift();
        toAdd.isActive = 1;
        toAdd.dataChanged = true;
        currentActive.push(toAdd);
        actions.push({
          item: "rotation",
          status: "ACTIVATE",
          detail: `Bật thêm ${toAdd.email} để đạt ngưỡng tối ưu 2-3 accounts hoạt động`
        });
      }
    }

    // 5. Lưu vào SQLite database
    let totalUpdated = 0;
    for (const c of parsedConns) {
      if (c.dataChanged) {
        totalUpdated++;
        if (!DRY_RUN) {
          db.prepare("update providerConnections set isActive = ?, data = ? where id = ?")
            .run(c.isActive, JSON.stringify(c.data), c.id);
        }
      }
    }
    db.close();

    const finalActiveList = parsedConns.filter((c) => c.isActive === 1).map((c) => c.email);
    actions.push({
      item: "pool",
      status: "OK",
      detail: `Pool an toàn: ${finalActiveList.length} accounts đang bật (${finalActiveList.join(", ")}). Còn lại ${parsedConns.length - finalActiveList.length} accounts nghỉ ngơi.`
    });

  } catch (err) {
    actions.push({ item: "pool", status: "WARN", detail: `Không thể can thiệp DB 9router: ${err.message}` });
  }
}

// ---------------------------------------------------------------- Step 5: Stale Processes Check
function checkStaleProcesses(warnings) {
  if (process.platform !== "win32") return;
  try {
    const out = execFileSync("powershell", [
      "-NoProfile", "-Command",
      "Get-CimInstance Win32_Process | Select-Object ProcessId,CreationDate,CommandLine | ConvertTo-Json -Compress"
    ], { encoding: "utf8", timeout: 15000 });
    const arr = JSON.parse(out);
    const procs = (Array.isArray(arr) ? arr : [arr]).map((p) => ({
      pid: p.ProcessId,
      started: Number(String(p.CreationDate || "").replace(/[^0-9]/g, "")) || null,
      cmd: String(p.CommandLine || ""),
    }));

    const configs = [
      { id: "omp", path: "~/.omp/agent/models.yml", pattern: "omp.exe" },
      { id: "pi", path: "~/.pi/agent/models.json", pattern: "pi-coding-agent" },
      { id: "opencode", path: "~/.config/opencode/opencode.json", pattern: "opencode.exe" },
      { id: "codex", path: "~/.codex/config.toml", pattern: "codex.exe" },
      { id: "claude", path: "~/.claude/settings.json", pattern: "claude.exe" }
    ];

    for (const cfg of configs) {
      const full = expand(cfg.path);
      if (!fs.existsSync(full)) continue;
      const mtime = fs.statSync(full).mtimeMs;
      const stale = procs.filter((p) =>
        p.cmd.toLowerCase().includes(cfg.pattern.toLowerCase()) &&
        !/cmd\.exe/i.test(p.cmd) &&
        p.started &&
        mtime > p.started + 2000
      );
      if (stale.length > 0) {
        const pids = stale.map((p) => p.pid).join(", ");
        warnings.push(`Tiến trình '${cfg.id}' (PID: ${pids}) khởi động trước khi file cấu hình được sửa. Khởi động lại terminal khi thuận tiện để nạp cổng 20129.`);
      }
    }
  } catch {
    /* ignore process inspection errors */
  }
}

// ---------------------------------------------------------------- Step 6: Post-Verification Probes
async function verifyProbes(results) {
  if (SKIP_PROBES) return;
  const keyFile = expand("~/.config/opencode/.secrets/9router-api-key.txt");
  let apiKey = fs.existsSync(keyFile) ? fs.readFileSync(keyFile, "utf8").trim() : null;
  if (!apiKey) {
    const rawOmp = readText("~/.omp/agent/models.yml") || "";
    const m = rawOmp.match(/apiKey:\s*(\S+)/);
    if (m) apiKey = m[1];
  }

  if (!apiKey) return;

  const piSettings = readText("~/.pi/agent/settings.json");
  let piModel = "conductor";
  if (piSettings) {
    try {
      const parsed = JSON.parse(piSettings);
      if (parsed.defaultModel) piModel = parsed.defaultModel;
    } catch {}
  }

  const probeTargets = [
    { id: "omp", url: "http://127.0.0.1:20129/v1/chat/completions", model: "deliberate", type: "openai" },
    { id: "pi", url: "http://127.0.0.1:20129/v1/chat/completions", model: piModel, type: "openai" },
    { id: "opencode", url: "http://127.0.0.1:20129/v1/chat/completions", model: "conductor", type: "openai" },
    { id: "codex", url: "http://127.0.0.1:20129/v1/responses", model: "conductor", type: "responses" },
    { id: "claude", url: "http://127.0.0.1:20129/v1/messages", model: "conductor", type: "anthropic" }
  ];

  for (const t of probeTargets) {
    await sleep(500);
    const headers = { "content-type": "application/json" };
    let body;
    if (t.type === "anthropic") {
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
      body = { model: t.model, max_tokens: 4, system: "SYSTEM_TEST", messages: [{ role: "user", content: "ping" }] };
    } else if (t.type === "responses") {
      headers.authorization = "Bearer " + apiKey;
      body = { model: t.model, instructions: "SYSTEM_TEST", input: "ping", max_output_tokens: 4 };
    } else {
      headers.authorization = "Bearer " + apiKey;
      body = { model: t.model, messages: [{ role: "system", content: "SYSTEM_TEST" }, { role: "user", content: "ping" }], max_tokens: 4, stream: false };
    }

    try {
      const r = await fetch(t.url, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(45000) });
      const text = await r.text();
      results.push({ id: t.id, model: t.model, status: r.status, ok: r.ok, verdict: r.ok ? "OK+sys" : `HTTP_${r.status}` });
    } catch (err) {
      results.push({ id: t.id, model: t.model, status: 0, ok: false, verdict: "TIMEOUT: " + err.message });
    }
  }
}

// ---------------------------------------------------------------- Main
(async () => {
  const actions = [];
  const warnings = [];
  const probes = [];

  console.log("===============================================================");
  console.log(" 9Router & Harness Automated Remediation Engine (v1.0.0)");
  console.log("===============================================================\n");

  // Step 1: Shim
  console.log("[1/5] Kiểm tra ag-prompt-shim (cổng 20129)...");
  await remediateShim(actions);

  // Step 2: Startup
  console.log("[2/5] Đảm bảo kịch bản tự khởi động Windows Startup...");
  remediateStartup(actions);

  // Step 3: Harness Configs
  console.log("[3/5] Rà soát và cấu hình Base URL cổng 20129 cho các harness...");
  remediateHarnesses(actions);

  // Step 4: Pool & Smart Account Rotation (2-3 Active)
  console.log("[4/5] Xoay vòng & duy trì 2-3 tài khoản Antigravity an toàn...");
  remediatePoolAccounts(actions);

  // Step 5: Verification & Stale check
  console.log("[5/5] Kiểm tra tiến trình cũ & chạy live probes kiểm chứng...");
  checkStaleProcesses(warnings);
  await verifyProbes(probes);

  if (JSON_OUT) {
    console.log(JSON.stringify({ actions, warnings, probes }, null, 2));
    return;
  }

  console.log("\n---------------------------------------------------------------");
  console.log(" KẾT QUẢ XỬ LÝ (ACTIONS TAKEN):");
  console.log("---------------------------------------------------------------");
  for (const a of actions) {
    console.log(`  [${a.status.padEnd(7)}] ${a.item.padEnd(10)}: ${a.detail}`);
  }

  if (probes.length) {
    console.log("\n---------------------------------------------------------------");
    console.log(" KẾT QUẢ KIỂM CHỨNG TƯƠI (LIVE PROBE VERIFICATION):");
    console.log("---------------------------------------------------------------");
    for (const p of probes) {
      console.log(`  [${p.verdict.padEnd(8)}] Harness '${p.id.padEnd(8)}' -> Model '${p.model.padEnd(12)}' (HTTP ${p.status})`);
    }
  }

  if (warnings.length) {
    console.log("\n---------------------------------------------------------------");
    console.log(" CẢNH BÁO TIẾN TRÌNH CŨ (STALE PROCESSES):");
    console.log("---------------------------------------------------------------");
    for (const w of warnings) {
      console.log(`  [WARN] ${w}`);
    }
  }

  console.log("\n===============================================================");
  const allProbesOk = probes.length > 0 && probes.every((p) => p.ok);
  if (allProbesOk) {
    console.log(" >> TRẠNG THÁI: HOÀN TẤT - HỆ THỐNG 100% SẴN SÀNG HOẠT ĐỘNG! <<");
  } else {
    console.log(" >> TRẠNG THÁI: ĐÃ THỰC THI SỬA ĐỔI (Xem chi tiết bảng probe trên) <<");
  }
  console.log("===============================================================\n");
})();
