# Jira 整合（MCP）

**Jira Project:** [V2](https://tianwen7252.atlassian.net/jira/software/projects/V2/boards)

所有 Jira 操作透過 **Atlassian MCP server**（`mcp-atlassian`）執行

Priority, type, 標籤類的保持英文，其餘生成的內容都是繁體中文(台灣地區)

## 票據階層

```
Epic (plan title)
  ├── Story: Scope A  [component:auth]        ← planner 建立
  │     ├── Subtask: [TDD] Story A            ← tdd-guide 建立
  │     ├── Bug: [Critical] issue             ← code-reviewer CRITICAL
  │     └── Subtask: [High] issue             ← code-reviewer HIGH
  ├── Story: Scope B  [component:order]
  │     └── Subtask: [TDD] Story B
  └── Task: [Security] finding  [security:critical]  ← security-reviewer 建立
```

## Jira Status 流程

```
To Do → In Progress → Done (git push)
              │
              └──→ Verified (E2E 通過)
Done/Verified → REOPENED (CRITICAL bug)
```

| Status      | 類別   | 說明                           |
| ----------- | ------ | ------------------------------ |
| To Do       | new    | 建立時預設                     |
| In Progress | active | 開始工作時                     |
| Done        | done   | git push 時轉換                |
| Verified    | done   | E2E 測試全部通過時             |
| REOPENED    | new    | code-reviewer 發現 CRITICAL 時 |
| DELETE      | —      | 僅手動使用                     |

## Claude 主動操作流程

由於不再使用 hooks 自動化，Claude **必須在以下時機主動呼叫 MCP tools**：

| 時機                   | MCP 操作                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| planner 完成           | `jira_create_issue`（Epic）+ N 個 Stories，`jira_transition_issue` → In Progress                         |
| 開始處理某個 Story     | `jira_transition_issue` → In Progress，更新 `.jira-session.json`                                         |
| tdd-guide 完成         | `jira_create_issue`（Subtask）掛在 active Story 下，`jira_transition_issue` → Done                       |
| code-reviewer 完成     | CRITICAL → `jira_create_issue`（Bug）+ Story → REOPENED；HIGH → Subtask；MEDIUM/LOW → `jira_add_comment` |
| security-reviewer 完成 | `jira_create_issue`（Task）掛在 Epic 下，加 `security:critical/medium` label                             |
| `git commit`           | `jira_add_comment` 在 active Story 加 commit SHA                                                         |
| `git push`             | `jira_transition_issue` active Story → Done；檢查 Epic 子票是否全部完成                                  |
| E2E 全部通過           | `jira_transition_issue` active Story → Verified                                                          |

## Session 狀態（`.jira-session.json`）

Session 檔案用於追蹤目前工作中的 Epic 和 Story，由 Claude 直接讀寫管理。

```json
{
  "epicKey": "DEV-10",
  "epicSummary": "Plan title",
  "planFile": ".claude/plans/2026-03-16-feature.md",
  "stories": [
    { "key": "DEV-11", "summary": "Auth scope", "scope": "component:auth" }
  ],
  "activeStoryKey": "DEV-11"
}
```

## MCP Tools 對應表

| 操作       | MCP Tool                                   |
| ---------- | ------------------------------------------ |
| 建立 Issue | `mcp__atlassian__jira_create_issue`        |
| 批量建立   | `mcp__atlassian__jira_batch_create_issues` |
| 查詢 Issue | `mcp__atlassian__jira_get_issue`           |
| JQL 搜尋   | `mcp__atlassian__jira_search`              |
| 狀態轉換   | `mcp__atlassian__jira_transition_issue`    |
| 加留言     | `mcp__atlassian__jira_add_comment`         |
| 更新 Issue | `mcp__atlassian__jira_update_issue`        |

## 相關檔案

| 檔案                            | 用途                                       |
| ------------------------------- | ------------------------------------------ |
| `.mcp.json`                     | Atlassian MCP server 設定（含 Jira token） |
| `.jira-session.json`            | 目前工作中的 Epic/Story session 狀態       |
| `~/.claude/agents/jira-sync.md` | 手動同步 agent                             |
