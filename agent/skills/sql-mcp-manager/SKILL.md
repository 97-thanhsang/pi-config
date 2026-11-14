---
name: sql-mcp-manager
description: >-
  Sets up, configures, and manages Model Context Protocol (MCP) servers for SQL databases
  (SQL Server / MSSQL, PostgreSQL, MySQL, SQLite) across multiple AI harnesses:
  Pi harness (`~/.pi/agent/mcp.json`), SSMS 22 (`~/.mcp.json`), Cursor (`~/.cursor/mcp.json`),
  and Claude Desktop (`%APPDATA%/Claude/claude_desktop_config.json`).
  Use when the user asks to "setup database mcp", "connect AI to SQL", "configure sqlserver mcp",
  "add database tool to harness", or setup database access for any agent.
---

# SQL MCP Manager Skill

This skill automates the configuration of database MCP servers (powered by `@bytebase/dbhub` and official MCP protocol) into your AI harnesses.

## Capabilities

1. **Configure Pi Harness**: Automatically writes to `~/.pi/agent/mcp.json` or uses `pi mcp add`.
2. **Configure SSMS 22**: Updates `%USERPROFILE%\.mcp.json` using the SSMS `servers` schema.
3. **Configure Cursor & Claude**: Updates `~/.cursor/mcp.json` and `%APPDATA%\Claude\claude_desktop_config.json`.
4. **Credential Safety**: Automatically URL-encodes special characters in passwords (`@`, `#`, `$`, `%`) so connection strings don't fail.

---

## Automated CLI Usage

Inside this skill directory, a Python script is available at:
`C:\Users\THANHSANG\.pi\agent\skills\sql-mcp-manager\scripts\setup_mcp.py`

### Common Commands

#### 1. Setup for Pi Harness (Current Agent):
```bash
python "C:\Users\THANHSANG\.pi\agent\skills\sql-mcp-manager\scripts\setup_mcp.py" ^
  --harness pi ^
  --type sqlserver ^
  --host 192.168.0.6 ^
  --port 1433 ^
  --user mcp_ai_user ^
  --password "YOUR_PASSWORD" ^
  --database "YOUR_DB_NAME"
```

#### 2. Setup for SSMS 22:
```bash
python "C:\Users\THANHSANG\.pi\agent\skills\sql-mcp-manager\scripts\setup_mcp.py" ^
  --harness ssms ^
  --type sqlserver ^
  --host 192.168.0.6 ^
  --port 1433 ^
  --user mcp_ai_user ^
  --password "YOUR_PASSWORD" ^
  --database "YOUR_DB_NAME"
```

#### 3. Setup for ALL Harnesses at Once (Pi, SSMS, Cursor, Claude):
```bash
python "C:\Users\THANHSANG\.pi\agent\skills\sql-mcp-manager\scripts\setup_mcp.py" ^
  --harness all ^
  --type sqlserver ^
  --host 192.168.0.6 ^
  --port 1433 ^
  --user mcp_ai_user ^
  --password "YOUR_PASSWORD" ^
  --database "YOUR_DB_NAME"
```

---

## Verification & Health Check

After applying configuration:

1. **Verify Pi Harness:**
   ```bash
   pi mcp list
   ```
   A healthy connection shows `sqlserver: ready` with available tools:
   - `search_objects` (Read Schema)
   - `execute_sql` (Read/Write Queries)

2. **Verify in SSMS 22:**
   - Open SSMS 22 -> Copilot Chat -> Switch to **Agent Mode**.
   - Click the **Tools** icon -> verify `sqlserver` tools are enabled.

---

## Manual File Paths Reference

If manual verification is needed, the respective configuration files are:

| Harness | Configuration File Path | JSON Root Key |
| :--- | :--- | :--- |
| **Pi Harness** | `C:\Users\THANHSANG\.pi\agent\mcp.json` | `mcpServers` |
| **SSMS 22** | `C:\Users\THANHSANG\.mcp.json` | `servers` |
| **Cursor** | `C:\Users\THANHSANG\.cursor\mcp.json` | `mcpServers` |
| **Claude Desktop** | `C:\Users\THANHSANG\AppData\Roaming\Claude\claude_desktop_config.json` | `mcpServers` |
