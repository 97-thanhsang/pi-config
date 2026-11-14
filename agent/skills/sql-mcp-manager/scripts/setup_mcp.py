"""
SQL MCP Setup Script for Multiple AI Harnesses
Supports:
  - Pi Harness (~/.pi/agent/mcp.json)
  - SSMS 22 (~/.mcp.json)
  - Cursor (~/.cursor/mcp.json)
  - Claude Desktop (%APPDATA%/Claude/claude_desktop_config.json)
  - OpenCode (~/.config/opencode/mcp.json)
"""

import sys
import os
import json
import urllib.parse
import argparse

def get_dsn(db_type, host, port, user, password, database, encrypt=False):
    encoded_pass = urllib.parse.quote(password, safe="")
    if db_type == "sqlserver":
        ssl_mode = "require" if encrypt else "disable"
        return f"sqlserver://{user}:{encoded_pass}@{host}:{port}/{database}?sslmode={ssl_mode}"
    elif db_type == "postgres":
        ssl_mode = "require" if encrypt else "disable"
        return f"postgres://{user}:{encoded_pass}@{host}:{port}/{database}?sslmode={ssl_mode}"
    elif db_type == "mysql":
        return f"mysql://{user}:{encoded_pass}@{host}:{port}/{database}"
    elif db_type == "sqlite":
        return f"sqlite:///{database}"
    else:
        raise ValueError(f"Unsupported db_type: {db_type}")

def update_json_file(file_path, root_key, server_name, server_config):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    data = {}
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            data = {}
    
    if root_key not in data or not isinstance(data[root_key], dict):
        data[root_key] = {}
        
    data[root_key][server_name] = server_config
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[OK] Updated {file_path}")

def main():
    parser = argparse.ArgumentParser(description="Configure Database MCP for AI Harnesses")
    parser.add_argument("--harness", choices=["pi", "ssms", "cursor", "claude", "all"], default="pi",
                        help="Target harness (default: pi, or 'all')")
    parser.add_argument("--type", choices=["sqlserver", "postgres", "mysql", "sqlite"], default="sqlserver",
                        help="Database type (default: sqlserver)")
    parser.add_argument("--host", default="192.168.0.6", help="Host IP or domain")
    parser.add_argument("--port", type=int, default=1433, help="Port (default: 1433 for MSSQL, 5432 for PG, 3306 for MySQL)")
    parser.add_argument("--user", default="mcp_ai_user", help="Database username")
    parser.add_argument("--password", required=True, help="Database password")
    parser.add_argument("--database", required=True, help="Database name")
    parser.add_argument("--server-name", default="sqlserver", help="MCP server ID/name")

    args = parser.parse_args()

    dsn = get_dsn(args.type, args.host, args.port, args.user, args.password, args.database)

    # Standard dbhub config
    server_config_std = {
        "command": "npx",
        "args": ["-y", "@bytebase/dbhub@latest", "--dsn", dsn],
        "description": f"Database MCP for {args.type} ({args.database})"
    }

    user_home = os.path.expanduser("~")
    appdata = os.environ.get("APPDATA", user_home)

    targets = []
    if args.harness in ["pi", "all"]:
        targets.append((os.path.join(user_home, ".pi", "agent", "mcp.json"), "mcpServers"))
    if args.harness in ["cursor", "all"]:
        targets.append((os.path.join(user_home, ".cursor", "mcp.json"), "mcpServers"))
    if args.harness in ["claude", "all"]:
        targets.append((os.path.join(appdata, "Claude", "claude_desktop_config.json"), "mcpServers"))
    if args.harness in ["ssms", "all"]:
        # SSMS uses 'servers' key instead of 'mcpServers'
        targets.append((os.path.join(user_home, ".mcp.json"), "servers"))

    for fpath, key in targets:
        update_json_file(fpath, key, args.server_name, server_config_std)

    print("\n[SUCCESS] Configuration complete!")
    print(f"DSN configured: {dsn[:40]}... (password masked)")
    if args.harness in ["pi", "all"]:
        print("Run 'pi mcp list' to verify the server status.")

if __name__ == "__main__":
    main()
