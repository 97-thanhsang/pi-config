#!/usr/bin/env node
"use strict";

// check-9router-harnesses — read-only audit of every local harness that talks to 9router.
// Run: node --experimental-sqlite scripts/check.js [--no-probe] [--json] [--harness=id] [--max-probes=N]

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const HERE = __dirname;
const MANIFEST = JSON.parse(fs.readFileSync(path.join(HERE, "..", "assets", "harness-map.json"), "utf8"));

const argv = process.argv.slice(2);
const NO_PROBE = argv.includes("--no-probe");
const JSON_OUT = argv.includes("--json");
const ONLY = (argv.find((a) => a.startsWith("--harness=")) || "").split("=")[1] || null;
const MAX_PROBES = Number((argv.find((a) => a.startsWith("--max-probes=")) || "").split("=")[1] || 12);
const TIMEOUT_MS = Number((argv.find((a) => a.startsWith("--timeout=")) || "").split("=")[1] || 20000);

function expand(p) {
  if (!p) return p;
  let out = p.replace(/^~(?=$|[\\/])/, os.homedir());
  out = out.replace(/%([A-Z_]+)%/g, (_, k) => process.env[k] || "");
  return out;
}

function readText(p) {
  try { return fs.readFileSync(expand(p), "utf8"); } catch { return null; }
}

function m(text, re) {
  if (!text) return null;
  const hit = text.match(re);
  return hit ? hit[1] : null;
}

function redact(key) {
  if (!key) return "-";
  if (key.length <= 10) return key.slice(0, 3) + "***";
  return key.slice(0, 7) + "***" + key.slice(-3);
}

function resolveKey(value, configPath) {
  if (typeof value !== "string" || !value) return null;
  const fileRef = value.match(/^\{file:(.+)\}$/);
  if (!fileRef) return value;
  const target = path.isAbsolute(fileRef[1]) ? fileRef[1] : path.resolve(path.dirname(expand(configPath)), fileRef[1]);
  try { return fs.readFileSync(target, "utf8").trim(); } catch { return null; }
}

function portOf(baseUrl) {
  try {
    const u = new URL(baseUrl);
    return Number(u.port || (u.protocol === "https:" ? 443 : 80));
  } catch { return null; }
}

function uniq(list) { return [...new Set(list.filter(Boolean))]; }

// ---------------------------------------------------------------- parsers

function parseOmp(configPath) {
  const text = readText(configPath);
  if (text === null) return { error: "missing config" };
  const baseUrl = m(text, /^\s*baseUrl:\s*(\S+)/m);
  const apiKey = m(text, /^\s*apiKey:\s*(\S+)/m);
  const api = m(text, /^\s*api:\s*(\S+)/m) || "openai-completions";
  const models = [...text.matchAll(/^\s*-\s*id:\s*(\S+)/gm)].map((x) => x[1]);
  const cfg = readText("~/.omp/agent/config.yml") || "";
  const defaultModel = m(cfg, /^\s*model:\s*(\S+)/m);
  if (!baseUrl) return { targets: [] };
  return { targets: [{ providerName: "9router", baseUrl, apiKey, api, models, defaultModel }] };
}

function parsePi(configPath) {
  const text = readText(configPath);
  if (text === null) return { error: "missing config" };
  let j;
  try { j = JSON.parse(text); } catch (e) { return { error: "invalid JSON: " + e.message }; }
  const targets = [];
  for (const [name, p] of Object.entries(j.providers || {})) {
    const baseUrl = p.baseUrl || p.base_url;
    if (!baseUrl) continue;
    targets.push({
      providerName: name,
      baseUrl,
      apiKey: p.apiKey,
      api: p.api || "openai-completions",
      models: (p.models || []).map((x) => x.id).filter(Boolean),
      defaultModel: null,
    });
  }
  return { targets };
}

function parseOpencode(configPath) {
  const text = readText(configPath);
  if (text === null) return { error: "missing config" };
  let j;
  try { j = JSON.parse(text); } catch (e) { return { error: "invalid JSON: " + e.message }; }
  const targets = [];
  for (const [name, p] of Object.entries(j.providers || {})) {
    const s = p.settings || {};
    const baseUrl = s.baseURL || s.baseUrl;
    if (!baseUrl) continue;
    const models = Object.keys(p.models || {});
    const selected = typeof j.model === "string" && j.model.startsWith(name + "/") ? j.model.slice(name.length + 1) : null;
    targets.push({ providerName: name, baseUrl, apiKey: s.apiKey, api: p.package || "openai-compatible", models, defaultModel: selected });
  }
  return { targets };
}

function parseCodex(configPath) {
  const text = readText(configPath);
  if (text === null) return { error: "missing config" };
  const baseUrl = m(text, /^\s*base_url\s*=\s*"([^"]+)"/m);
  const model = m(text, /^\s*model\s*=\s*"([^"]+)"/m);
  const wire = m(text, /^\s*wire_api\s*=\s*"([^"]+)"/m);
  const key = m(text, /Authorization\s*=\s*"Bearer\s+([^"]+)"/);
  if (!baseUrl) return { targets: [] };
  return { targets: [{ providerName: "9router", baseUrl, apiKey: key, api: wire === "responses" ? "responses" : "openai-completions", models: model ? [model] : [], defaultModel: model }] };
}

function parseClaude(configPath) {
  const text = readText(configPath);
  if (text === null) return { error: "missing config" };
  let j;
  try { j = JSON.parse(text); } catch (e) { return { error: "invalid JSON: " + e.message }; }
  const env = j.env || {};
  const pick = (re) => { const k = Object.keys(env).find((x) => re.test(x)); return k ? env[k] : null; };
  const baseUrl = pick(/BASE_URL$/);
  const key = pick(/API_KEY$/);
  const models = uniq(Object.keys(env).filter((k) => /MODEL$/.test(k)).map((k) => env[k]));
  if (!baseUrl) return { targets: [] };
  return { targets: [{ providerName: "9router", baseUrl, apiKey: key, api: "anthropic", models, defaultModel: pick(/^ANTHROPIC_MODEL$/) || models[0] || null }] };
}

function parseGemini(configPath) {
  const text = readText(configPath);
  if (text === null) return { error: "missing config" };
  let j;
  try { j = JSON.parse(text); } catch (e) { return { error: "invalid JSON: " + e.message }; }
  const found = [];
  (function walk(v, p) {
    if (typeof v === "string" && /127\.0\.0\.1:2012[89]|localhost:2012[89]/.test(v)) found.push({ path: p, value: v });
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, p + "." + k);
  })(j, "");
  if (!found.length) return { targets: [] };
  return { targets: [{ providerName: "9router", baseUrl: found[0].value, apiKey: null, api: "openai-completions", models: [], defaultModel: null, note: "found at " + found[0].path }] };
}

const PARSERS = { omp: parseOmp, pi: parsePi, opencode: parseOpencode, codex: parseCodex, claude: parseClaude, gemini: parseGemini };

// ---------------------------------------------------------------- 9router DB

function loadDb() {
  const dbPath = expand(MANIFEST.db);
  if (!fs.existsSync(dbPath)) return { error: "db missing: " + dbPath };
  let DatabaseSync;
  try { ({ DatabaseSync } = require("node:sqlite")); }
  catch (e) { return { error: "node:sqlite unavailable — run with --experimental-sqlite (" + e.message + ")" }; }
  try {
    const db = new DatabaseSync(dbPath, { readOnly: true });
    const keys = db.prepare("select key, isActive, name from apiKeys").all();
    const combos = db.prepare("select name, models from combos").all();
    const conns = db.prepare("select id, email, priority, isActive, data from providerConnections where provider='antigravity'").all();
    const errors = db.prepare("select timestamp, provider, model, connectionId, data from requestDetails where status='error' and timestamp >= ? order by timestamp desc limit 500")
      .all(new Date(Date.now() - 24 * 3600 * 1000).toISOString());
    db.close();
    return { keys, combos, conns, errors };
  } catch (e) {
    return { error: "db read failed: " + e.message };
  }
}

function poolSummary(data) {
  const now = Date.now();
  let active = 0, unavailable = 0, locked = 0;
  const lockedModels = [];
  for (const c of data.conns) {
    let d = {};
    try { d = JSON.parse(c.data); } catch { /* ignore */ }
    if (c.isActive) {
      active++;
      if (d.testStatus === "unavailable") unavailable++;
      for (const [k, v] of Object.entries(d)) {
        if (k.startsWith("modelLock_") && v && new Date(v).getTime() > now) { locked++; lockedModels.push(k.replace("modelLock_", "")); }
      }
    }
  }
  const bare429 = data.errors.filter((r) => {
    try {
      const d = JSON.parse(r.data);
      const body = String(d.response?.error || d.providerResponse?.error?.message || "");
      return /Resource has been exhausted/i.test(body) && !/QUOTA_EXHAUSTED|RATE_LIMIT|Individual quota|Resets in|retryDetails|"details"/i.test(body);
    } catch { return false; }
  }).length;
  const err404 = data.errors.filter((r) => {
    try {
      const d = JSON.parse(r.data);
      const status = d.response?.status || d.providerResponse?.error?.code;
      return status === 404;
    } catch { return false; }
  }).length;
  return { active, total: data.conns.length, unavailable, locked, lockedModels: uniq(lockedModels), bare429, err404 };
}

// ---------------------------------------------------------------- runtime

async function getJson(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const text = await r.text();
    let body = null;
    try { body = JSON.parse(text); } catch { body = text.slice(0, 200); }
    return { ok: r.ok, status: r.status, body };
  } catch (e) {
    return { ok: false, status: 0, error: e.message };
  }
}

function processTable() {
  if (process.platform !== "win32") return [];
  try {
    const out = execFileSync("powershell", ["-NoProfile", "-Command",
      "Get-CimInstance Win32_Process | Select-Object ProcessId,CreationDate,CommandLine | ConvertTo-Json -Compress"], { encoding: "utf8", timeout: 20000 });
    const arr = JSON.parse(out);
    return (Array.isArray(arr) ? arr : [arr]).map((p) => ({
      pid: p.ProcessId,
      started: Number(String(p.CreationDate || "").replace(/[^0-9]/g, "")) || null,
      cmd: String(p.CommandLine || ""),
    }));
  } catch { return []; }
}

// ---------------------------------------------------------------- probes

function classify(status, text) {
  if (status >= 200 && status < 300) return "OK";
  if (status === 401 || status === 403) return "AUTH";
  if (status === 404) return "NO_MODEL";
  if (status === 429) {
    if (/Resource has been exhausted/i.test(text) && !/"details"/i.test(text)) return "BARE_429";
    return "QUOTA_429";
  }
  if (status === 503) {
    const inner = text.match(/\[(\d{3})\]/);
    return "POOL_" + (inner ? inner[1] : "503");
  }
  if (status === 0) return "TIMEOUT";
  return "HTTP_" + status;
}

function probeUrl(target) {
  const base = String(target.baseUrl).replace(/\/$/, "");
  if (target.api === "anthropic") return base.endsWith("/v1") ? base + "/messages" : base + "/v1/messages";
  if (target.api === "responses") return base.endsWith("/v1") ? base + "/responses" : base + "/v1/responses";
  return base.endsWith("/v1") ? base + "/chat/completions" : base + "/v1/chat/completions";
}

function probeRequest(target, model, key, withSystem) {
  const url = probeUrl(target);
  const headers = { "content-type": "application/json" };
  let body;
  if (target.api === "anthropic") {
    headers["x-api-key"] = key;
    headers["anthropic-version"] = "2023-06-01";
    body = { model, max_tokens: 4, messages: [{ role: "user", content: "ping" }] };
    if (withSystem) body.system = "SYS";
  } else if (target.api === "responses") {
    headers.authorization = "Bearer " + key;
    body = { model, input: "ping", max_output_tokens: 4 };
    if (withSystem) body.instructions = "SYS";
  } else {
    headers.authorization = "Bearer " + key;
    const messages = withSystem ? [{ role: "system", content: "SYS" }, { role: "user", content: "ping" }] : [{ role: "user", content: "ping" }];
    body = { model, messages, max_tokens: 4, stream: false };
  }
  return { url, headers, body };
}

let probeCount = 0;
async function runProbe(target, model, key, withSystem) {
  if (probeCount >= MAX_PROBES) return { tag: "SKIP", ms: 0, note: "probe cap" };
  probeCount++;
  const { url, headers, body } = probeRequest(target, model, key, withSystem);
  const start = Date.now();
  try {
    const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(TIMEOUT_MS) });
    const text = await r.text();
    return { tag: classify(r.status, text), status: r.status, ms: Date.now() - start, note: text.slice(0, 140).replace(/\s+/g, " ") };
  } catch (e) {
    return { tag: "TIMEOUT", status: 0, ms: Date.now() - start, note: e.message };
  }
}

// ---------------------------------------------------------------- main

(async () => {
  const router = await getJson(MANIFEST.router.base + MANIFEST.router.health);
  const shim = await getJson(MANIFEST.shim.base + MANIFEST.shim.health);
  const shimLog = readText(MANIFEST.shimLog);
  const shimLast = shimLog ? shimLog.trim().split(/\r?\n/).slice(-1)[0] : null;

  const db = loadDb();
  const pool = db.error ? null : poolSummary(db);
  const apiKeys = db.error ? [] : db.keys;
  const activeKeys = new Set(apiKeys.filter((k) => k.isActive).map((k) => k.key));
  const allKeys = new Set(apiKeys.map((k) => k.key));
  const comboNames = new Set(db.error ? [] : db.combos.map((c) => String(c.name).toLowerCase()));
  const procs = processTable();

  const matrix = readText(MANIFEST.matrixDoc);
  const startupDir = expand("%APPDATA%/Microsoft/Windows/Start Menu/Programs/Startup");
  const startupHasShim = (() => {
    try {
      return fs.readdirSync(startupDir).some((f) => {
        if (/\.(cmd|bat|ps1)$/i.test(f)) return /ag-prompt-shim/i.test(fs.readFileSync(path.join(startupDir, f), "utf8"));
        return /ag-prompt-shim/i.test(f);
      });
    } catch { return false; }
  })();

  const rows = [];
  const actions = [];
  const addAction = (severity, harness, text) => actions.push({ severity, harness, text });

  const harnesses = MANIFEST.harnesses.filter((h) => !ONLY || h.id === ONLY);
  for (const h of harnesses) {
    if (!fs.existsSync(expand(h.config))) {
      rows.push({ id: h.id, config: h.config, base: "-", api: "-", key: "-", model: "-", probe: "SKIP", risk: "-", verdict: "N/A", severity: "INFO" });
      continue;
    }
    const parsed = PARSERS[h.kind](h.config);
    if (parsed.error) {
      rows.push({ id: h.id, config: h.config, base: "-", api: "-", key: "-", model: "-", probe: "SKIP", risk: "-", verdict: parsed.error, severity: "FAIL" });
      addAction("FAIL", h.id, "Không đọc được config: " + parsed.error);
      continue;
    }
    if (!parsed.targets.length) {
      rows.push({ id: h.id, config: h.config, base: "-", api: "-", key: "-", model: "-", probe: "SKIP", risk: "-", verdict: "không trỏ 9router", severity: "INFO" });
      continue;
    }

    const configMtime = fs.statSync(expand(h.config)).mtimeMs;
    const staleProcs = procs.filter((p) => p.cmd.toLowerCase().includes(h.process.toLowerCase())
      && !/cmd\.exe/i.test(p.cmd)
      && p.started
      && configMtime > p.started + 2000);
    const stale = staleProcs.length > 0;

    for (const t of parsed.targets) {
      const port = portOf(t.baseUrl);
      const key = resolveKey(t.apiKey, h.config);
      const model = t.defaultModel || t.models[0] || "-";
      const isCombo = typeof model === "string" && comboNames.has(model.toLowerCase());
      const isAg = typeof model === "string" && /^(antigravity|ag)\//i.test(model);
      const risk = isAg ? "ag-direct" : isCombo ? "combo->ag maybe" : "-";

      let severity = "OK";
      const notes = [];
      if (port === 20128 && !router.ok) { severity = "FAIL"; notes.push("9router 20128 không phản hồi"); }
      if (port === 20129 && !shim.ok) { severity = "FAIL"; notes.push("shim 20129 không chạy"); }
      if (port === 20129 && shim.body && shim.body.combos === 0) { severity = "FAIL"; notes.push("shim không nạp combo (thiếu --experimental-sqlite)"); addAction("FAIL", h.id, "Khởi động shim bằng start-shim.cmd (có --experimental-sqlite)."); }
      if (key && allKeys.size && !allKeys.has(key)) { if (severity !== "FAIL") severity = "WARN"; notes.push("key không có trong 9router"); }
      if (key && activeKeys.size && !activeKeys.has(key)) { if (severity !== "FAIL") severity = "WARN"; notes.push("key đang tắt"); }
      if (!key) { if (severity !== "FAIL") severity = "WARN"; notes.push("không đọc được key"); }
      if (stale) { if (severity !== "FAIL") severity = "WARN"; notes.push(staleProcs.length + " process cũ (mới nhất PID " + staleProcs.sort((a, b) => (b.started || 0) - (a.started || 0))[0].pid + ") vẫn dùng config trước khi sửa — cần restart"); }

      if (port === 20128 && h.systemPrompt && (isCombo || isAg)) {
        if (severity !== "FAIL") severity = "WARN";
        notes.push("system prompt + combo/ag trên lane trực tiếp");
        addAction("WARN", h.id, "Trỏ base URL sang " + MANIFEST.shim.base + " để tránh bare-429 (hoặc chờ bản vá upstream).");
      }
      if (port === 20129 && h.systemPrompt && (isCombo || isAg) && !agComboSafe(shim)) {
        if (severity !== "FAIL") severity = "WARN";
        notes.push("shim chưa xác nhận nhận combo");
      }

      let probe = "SKIP";
      let probeNote = "";
      if (!NO_PROBE && key) {
        const base = await runProbe(t, model, key, false);
        probe = base.tag;
        probeNote = base.note;
        if (base.tag === "NO_MODEL") { severity = "FAIL"; notes.push("model không tồn tại/không được phục vụ"); addAction("FAIL", h.id, "Sửa model '" + model + "' trong " + h.config + " sang id mà pool phục vụ."); }
        else if (base.tag.startsWith("POOL_")) { if (severity !== "FAIL") severity = "WARN"; notes.push("pool đang lock/không khả dụng (" + base.tag + ")"); }
        else if (base.tag === "AUTH") { severity = "FAIL"; notes.push("key bị từ chối"); }
        else if (base.tag === "TIMEOUT") { if (severity !== "FAIL") severity = "WARN"; notes.push("probe timeout"); }

        if (port === 20129 && h.systemPrompt && base.tag === "OK") {
          const sys = await runProbe(t, model, key, true);
          if (sys.tag !== "OK") { severity = "FAIL"; notes.push("shim system probe = " + sys.tag); addAction("FAIL", h.id, "Shim không rewrite đúng; kiểm tra cặp endpoint/field."); }
          else probe = "OK+sys";
        }
      }

      rows.push({
        id: h.id,
        config: h.config,
        base: t.baseUrl,
        api: t.api,
        key: redact(key),
        model,
        probe,
        risk,
        verdict: notes.length ? notes.join("; ") : "ok",
        severity,
        probeNote,
      });
    }
  }

  // Pool-level actions
  if (pool) {
    if (pool.active === 0) addAction("FAIL", "pool", "Không có account Antigravity nào đang bật.");
    if (pool.locked) addAction("WARN", "pool", `${pool.locked} model lock còn hạn (${pool.lockedModels.slice(0, 4).join(", ")}); chờ hết hạn hoặc gỡ lock qua dashboard.`);
    if (pool.unavailable) addAction("WARN", "pool", `${pool.unavailable}/${pool.active} account đang testStatus=unavailable; tự hồi khi có request thành công.`);
    if (pool.bare429 > 0) addAction("WARN", "pool", `${pool.bare429} bare-429 trong 24h — client vẫn gửi system prompt vào lane trực tiếp.`);
  }
  if (shim.ok && !startupHasShim) addAction("WARN", "shim", "Shim không có trong Startup; sau reboot phải chạy start-shim.cmd.");
  if (matrix) {
    const missing = ["omp", "pi", "opencode", "codex", "claude"].filter((x) => !new RegExp(x, "i").test(matrix));
    if (missing.length) addAction("INFO", "matrix", "Matrix doc thiếu harness: " + missing.join(", "));
    if (!/20129/.test(matrix) && shim.ok) addAction("INFO", "matrix", "Matrix doc chưa nhắc shim 20129.");
  }

  const result = {
    generatedAt: new Date().toISOString(),
    router: { ok: router.ok, status: router.status },
    shim: { ok: shim.ok, combos: shim.body?.combos ?? null, rewrites: shim.body?.rewrites ?? null, last: shimLast },
    db: db.error ? { error: db.error } : { keys: apiKeys.length, activeKeys: activeKeys.size, combos: comboNames.size },
    pool,
    harnesses: rows,
    actions,
  };

  if (JSON_OUT) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printReport(result);
  }
  const fail = rows.some((r) => r.severity === "FAIL") || actions.some((a) => a.severity === "FAIL");
  process.exitCode = fail ? 1 : 0;
})();

function agComboSafe(shim) {
  return !!(shim.ok && shim.body && Number(shim.body.combos) > 0);
}

function pad(v, n) {
  const s = String(v ?? "");
  return s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n);
}

function printReport(result) {
  console.log("9router harness audit — " + result.generatedAt);
  console.log(`router 20128: ${result.router.ok ? "up" : "DOWN"}`);
  console.log(`shim   20129: ${result.shim.ok ? `up (combos=${result.shim.combos}, rewrites=${result.shim.rewrites})` : "DOWN"}`);
  if (result.db.error) console.log("db: " + result.db.error);
  else console.log(`db: keys=${result.db.keys} active=${result.db.activeKeys} combos=${result.db.combos}`);
  if (result.pool) console.log(`pool: ag ${result.pool.active}/${result.pool.total} active, ${result.pool.locked} locked, ${result.pool.unavailable} unavailable, bare429(24h)=${result.pool.bare429}, 404(24h)=${result.pool.err404}`);

  console.log("");
  const widths = [10, 34, 26, 24, 12, 22, 9, 18, 44];
  const head = ["Harness", "Config", "Base URL", "API", "Key", "Model", "Probe", "Risk", "Verdict"];
  console.log(head.map((x, i) => pad(x, widths[i])).join(" "));
  for (const r of result.harnesses) {
    const row = [r.id, r.config, r.base, r.api, r.key, r.model, r.probe, r.risk, r.verdict];
    console.log(row.map((x, i) => pad(x, widths[i])).join(" "));
  }

  if (result.actions.length) {
    console.log("\nActions:");
    const order = { FAIL: 0, WARN: 1, INFO: 2 };
    for (const a of [...result.actions].sort((x, y) => order[x.severity] - order[y.severity])) {
      console.log(`  [${a.severity}] ${a.harness}: ${a.text}`);
    }
  } else {
    console.log("\nKhông có action nào.");
  }
}
