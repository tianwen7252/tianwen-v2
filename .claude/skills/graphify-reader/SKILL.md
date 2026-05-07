---
name: graphify-reader
description: Use this skill at the start of any task involving understanding codebase structure, finding modules, tracing dependencies, or locating where features are implemented. Reads pre-computed graph data instead of scanning source files.
---

# Graphify Reader

- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current
