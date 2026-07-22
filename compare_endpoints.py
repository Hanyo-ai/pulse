#!/usr/bin/env python3
"""对比 PULSE 端点列表 vs /v1/models 返回的模型列表"""
import sqlite3
import json
import sys
import os

DB_PATH = sys.argv[1] if len(sys.argv) > 1 else "pulse.db"

if not os.path.exists(DB_PATH):
    print(f"❌ 找不到数据库: {DB_PATH}")
    print(f"用法: {sys.argv[0]} [path/to/pulse.db]")
    sys.exit(1)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

print("=" * 80)
print("📊 PULSE 端点分析")
print("=" * 80)

# 1. 所有端点详情
rows = cur.execute("""
    SELECT id, display_name, provider_name, provider_format,
           model_name, models, endpoint_url, enabled
    FROM endpoints ORDER BY id
""").fetchall()

print(f"\n🔌 端点总数: {len(rows)}\n")
print(f"{'ID':<4} {'名称':<20} {'格式':<12} {'启用':<6} {'模型'}")
print("-" * 80)

all_models_from_endpoints = {}  # model -> list of endpoint infos
for r in rows:
    # 解析 models JSON 数组
    try:
        models_arr = json.loads(r["models"]) if r["models"] else []
    except:
        models_arr = []

    # 有效模型列表：优先 models 数组，否则用 model_name
    effective = models_arr if models_arr else ([r["model_name"]] if r["model_name"] else [])

    enabled_mark = "✅" if r["enabled"] else "❌"
    models_str = ", ".join(effective) if effective else "(无)"
    print(f"{r['id']:<4} {r['display_name'][:18]:<20} {r['provider_format']:<12} {enabled_mark:<6} {models_str}")

    for m in effective:
        if m not in all_models_from_endpoints:
            all_models_from_endpoints[m] = []
        all_models_from_endpoints[m].append({
            "id": r["id"],
            "name": r["display_name"],
            "format": r["provider_format"],
            "enabled": r["enabled"],
            "url": r["endpoint_url"][:50],
        })

# 2. 启用端点的模型统计
print("\n" + "=" * 80)
print("📈 按模型分组（仅统计 enabled=1 的端点）")
print("=" * 80)

enabled_models = {}
for model, eps in all_models_from_endpoints.items():
    enabled_eps = [e for e in eps if e["enabled"]]
    if enabled_eps:
        enabled_models[model] = enabled_eps

print(f"\n唯一模型数: {len(enabled_models)}\n")
for model, eps in sorted(enabled_models.items()):
    formats = [e["format"] for e in eps]
    print(f"  🏷️  {model}")
    print(f"      端点数: {len(eps)}  |  格式: {', '.join(set(formats))}")
    for e in eps:
        print(f"        - [{e['id']}] {e['name']} ({e['format']})")

# 3. 模拟 /v1/models 的去重逻辑
print("\n" + "=" * 80)
print("🔍 /v1/models 实际返回（去重后）")
print("=" * 80)
dedup_models = sorted(enabled_models.keys())
print(f"\n模型数量: {len(dedup_models)}\n")
for i, m in enumerate(dedup_models, 1):
    print(f"  {i}. {m}")

# 4. 找出被"合并"的模型
print("\n" + "=" * 80)
print("⚠️  被去重合并的模型（同一模型多个端点）")
print("=" * 80)
merged = {m: eps for m, eps in enabled_models.items() if len(eps) > 1}
if merged:
    for model, eps in merged.items():
        print(f"\n  🔀 {model}  —  {len(eps)} 个端点:")
        for e in eps:
            print(f"      - [{e['id']}] {e['name']} ({e['format']})  {e['url']}")
else:
    print("\n  (没有被合并的模型)")

# 5. gateway_keys 白名单检查
print("\n" + "=" * 80)
print("🔑 Gateway Keys 白名单")
print("=" * 80)
try:
    keys = cur.execute("SELECT key, models, enabled FROM gateway_keys").fetchall()
    if keys:
        for k in keys:
            try:
                whitelist = json.loads(k["models"]) if k["models"] else []
            except:
                whitelist = []
            status = "✅" if k["enabled"] else "❌"
            wl_str = ", ".join(whitelist) if whitelist else "(无限制)"
            key_preview = k["key"][:12] + "..." if len(k["key"]) > 12 else k["key"]
            print(f"\n  {status} Key: {key_preview}")
            print(f"     白名单: {wl_str}")
    else:
        print("\n  (没有 gateway_keys 记录)")
except sqlite3.OperationalError:
    print("\n  (gateway_keys 表不存在)")

# 6. 按格式统计
print("\n" + "=" * 80)
print("📦 按 provider_format 统计")
print("=" * 80)
format_stats = {}
for r in rows:
    if r["enabled"]:
        fmt = r["provider_format"]
        format_stats[fmt] = format_stats.get(fmt, 0) + 1
for fmt, cnt in sorted(format_stats.items()):
    print(f"  {fmt}: {cnt} 个端点")

conn.close()
print()
