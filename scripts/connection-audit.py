#!/usr/bin/env python3
"""
Real connection audit. Cross-references every /api/* call in src/
against every Fastify route registered in dotlive-backend, including
the actual mount prefix from server.ts.
"""
import re
import pathlib
import sys
import json

ROOT = pathlib.Path(r"C:\Users\GTHub\OneDrive\Desktop\dotlive-main")

def normalize(path: str) -> str:
    p = path.split('?')[0]
    p = re.sub(r'\$\{[^}]*\}', ':P', p)
    p = re.sub(r'/:[a-zA-Z_][a-zA-Z0-9_]*', '/:P', p)
    p = re.sub(r'([a-zA-Z]):P', r'\1:P', p)
    p = re.sub(r'([a-zA-Z]):P', r'\1/:P', p)
    if p.startswith('/api/'):
        p = p[5:]
    elif p == '/api':
        p = ''
    p = p.lstrip('/')
    return p

# ---- Build var-name -> mount prefix map from server.ts ----
server_ts = (ROOT / "dotlive-backend/apps/api/src/server.ts").read_text()

# Parse imports:  import { fooRoutes } from "./routes/foo.js";
import_re = re.compile(r'import\s*\{\s*(\w+Routes|\w+)\s*\}\s*from\s*"\.?/?routes/([^"]+)"')
var_to_file = {}
for m in import_re.finditer(server_ts):
    var = m.group(1)
    fname = m.group(2).rstrip('.js') + '.ts'
    var_to_file[var] = fname

# Parse registers:  await app.register(fooRoutes, { prefix: "/api/admin" });
reg_re = re.compile(r'register\s*\(\s*(\w+)\s*,\s*\{[^}]*prefix\s*:\s*"([^"]+)"')
mount_prefix = {}  # filename -> prefix (e.g. "admin.ts" -> "/api/admin")
for m in reg_re.finditer(server_ts):
    var = m.group(1)
    prefix = m.group(2)
    if var in var_to_file:
        mount_prefix[var_to_file[var]] = prefix

# Default: anything not registered or registered at /api → /api
def effective_prefix(fname: str) -> str:
    return mount_prefix.get(fname, "/api")

# ---- Backend ----
be_routes = set()
be_all_paths = set()
be_paths_by_method = {}

for f in (ROOT / "dotlive-backend/apps/api/src/routes").glob("*.ts"):
    txt = f.read_text()
    prefix = effective_prefix(f.name)  # e.g. "/api/admin"
    for m in re.finditer(r'app\.(get|post|put|patch|delete)\b', txt):
        method = m.group(1).upper()
        rest = txt[m.end():m.end()+400]
        pm = re.search(r'"(/[^"]+)"', rest)
        if pm:
            raw_path = pm.group(1)
            # Concatenate prefix (stripping its trailing slash) + raw_path
            if prefix and raw_path.startswith('/'):
                full_path = prefix.rstrip('/') + raw_path
            else:
                full_path = raw_path
            p = normalize(full_path)
            be_routes.add((method, p))
            be_paths_by_method.setdefault(method, set()).add(p)
            be_all_paths.add(p)

# ---- Frontend ----
fe_calls = set()
fe_all_paths = set()

for f in (ROOT / "src").rglob("*.ts*"):
    txt = f.read_text()
    for m in re.finditer(r'\.(get|post|put|patch|delete)\s*\(\s*[`"\']([^`"\']+)[`"\']', txt):
        method = m.group(1).upper()
        raw = m.group(2)
        if '/api/' not in raw:
            continue
        p = normalize(raw)
        fe_calls.add((method, p))
        fe_all_paths.add(p)

# ---- Diff ----
missing = []
for method, path in sorted(fe_calls):
    if (method, path) not in be_routes:
        if path in be_all_paths:
            available = [m for (m, pp) in be_routes if pp == path]
            missing.append((method, path, f"PATH EXISTS, methods={sorted(available)}"))
        else:
            missing.append((method, path, "NO SUCH PATH"))

print(f"Frontend calls (unique): {len(fe_calls)}")
print(f"Backend routes: {len(be_routes)}")
print(f"Unique paths (FE): {len(fe_all_paths)}")
print(f"Unique paths (BE): {len(be_all_paths)}")
print()
print(f"=== FRONTEND CALLS NOT MATCHED IN BACKEND: {len(missing)} ===")
for method, path, reason in missing:
    print(f"  {method:6s} /{path:45s}  [{reason}]")
