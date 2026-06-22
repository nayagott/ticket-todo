---
name: changelog
description: Record a prompt-driven changelog entry into CHANGELOG.md and update AGENTS.md recent changes summary
argument-hint: "Summarize the prompt/request in one line (e.g. 'Add ticket detail modal')"
user-invocable: true
disable-model-invocation: false
---

# Changelog Entry Recorder

This skill records a structured changelog entry for the current git state and keeps `AGENTS.md` up to date with a rolling 14-day summary.

## User Input

```text
$ARGUMENTS
```

The text above is the user's one-line summary of what they asked for (the "prompt"). If empty, ask the user: "변경 내용을 한 줄로 요약해주세요."

---

## Step 1 — Collect Context

Run these commands to gather raw data:

```bash
# 1. Current timestamp (KST = UTC+9)
date '+%Y-%m-%d %H:%M' --date='TZ="Asia/Seoul"' 2>/dev/null || date '+%Y-%m-%d %H:%M'

# 2. Current branch
git rev-parse --abbrev-ref HEAD

# 3. Latest commit hash (short)
git rev-parse --short HEAD

# 4. Staged + unstaged diff stat (files changed since last commit)
git diff HEAD --stat

# 5. Files changed between HEAD~1 and HEAD (last commit)
git diff HEAD~1 HEAD --stat 2>/dev/null || git diff --cached --stat

# 6. Untracked files
git ls-files --others --exclude-standard
```

Parse the output:

- `TIMESTAMP` = date/time string from command 1
- `BRANCH` = branch name from command 2
- `COMMIT` = short hash from command 3
- `DIFF_STAT` = raw output from commands 4–5 (choose whichever has content)
- `UNTRACKED` = list from command 6

---

## Step 2 — Parse Diff Stats into File Table

From `DIFF_STAT`, extract each line that looks like:
```
 src/client/components/Modal/CreateModal.tsx | 42 +++++++++--
```

Build a table:

```markdown
| 파일 | 추가 | 삭제 |
|------|------|------|
| `src/client/components/Modal/CreateModal.tsx` | +42 | -10 |
```

Rules:
- Parse `+` count and `-` count from the `+++`/`---` indicators (each `+` or `-` symbol ≈ 1 line change; use the numeric summary if available)
- If a file was newly created (appears in untracked or `git diff --diff-filter=A`), label it **[신규]**
- If a file was deleted, label it **[삭제]**
- Show relative paths from project root

---

## Step 3 — Detect Test Results (Optional)

Check if a test result is available by running:

```bash
# Check if jest output exists in current session or recent run
ls -t coverage/coverage-summary.json 2>/dev/null | head -1
```

If `coverage/coverage-summary.json` exists and was modified within the last 10 minutes, extract:
- Total statements coverage %
- Total branches coverage %

If no test data is available, set `TEST_RESULT` to `(테스트 미실행)`.

---

## Step 4 — Classify Changes

For each changed file, classify the change as one of:

| 태그 | 의미 |
|------|------|
| **Added** | 신규 파일 생성 |
| **Modified** | 기존 파일 수정 |
| **Deleted** | 파일 삭제 |
| **Refactored** | 기능 변화 없는 코드 개선 |

Use file path + diff content to make the classification.

---

## Step 5 — Write CHANGELOG.md Entry

### Location

`CHANGELOG.md` in the project root.

### If the file does not exist

Create it with this header:

```markdown
# Changelog

모든 주요 변경 이력을 기록합니다.  
형식: `/changelog "요청 내용"` 으로 항목 추가.

---
```

### Entry Format

Prepend (insert at top, after the header) a new entry in this format:

```markdown
## [BRANCH] - TIMESTAMP

### 🎯 Prompt

> "USER_INPUT"

### ✅ Changes

- **[태그]**: 변경 내용 설명 (`파일경로`)

### 📁 Files Modified

| 파일 | 추가 | 삭제 |
|------|------|------|
| `파일명` | +N | -M |

### 🧪 Tests

TEST_RESULT

### 🔗 Commit

`COMMIT` on `BRANCH`

---
```

Replace placeholders:
- `[BRANCH]` → actual branch name
- `TIMESTAMP` → KST datetime
- `USER_INPUT` → the `$ARGUMENTS` text
- `TEST_RESULT` → coverage summary or `(테스트 미실행)`
- `COMMIT` → short hash

---

## Step 6 — Update AGENTS.md Recent Changes Summary

### Target section

Look for a section in `AGENTS.md` called `## 최근 변경사항` (Recent Changes).

- If this section **does not exist**, append it at the very end of the file.
- If it **exists**, replace its content (between the `## 최근 변경사항` heading and the next `##` heading, or end of file).

### Content to write

```markdown
## 최근 변경사항

> 자동 기록 — `/changelog` 명령어로 갱신됨. 최근 14일 이내 항목만 표시.

| 날짜 | 브랜치 | 요약 | 커밋 |
|------|--------|------|------|
```

Populate the table by reading **all entries** from `CHANGELOG.md` and:
1. Filtering entries where the date part of `TIMESTAMP` is within the last 14 days from today
2. Sorting descending (newest first)
3. Each row: `| YYYY-MM-DD | branch | one-line summary from Prompt | short-hash |`

After the table, close the section with:
```markdown

*전체 이력은 [CHANGELOG.md](CHANGELOG.md) 참고.*
```

---

## Step 7 — Report to User

After writing both files, report:

```
✅ Changelog 기록 완료

- 📄 CHANGELOG.md — 새 항목 추가 ([BRANCH] - TIMESTAMP)
- 📋 AGENTS.md — 최근 변경사항 섹션 갱신 (N개 항목)
- 🔗 커밋: COMMIT
```

---

## Error Handling

- If not in a git repository: stop and say "git 저장소가 아닙니다."
- If `$ARGUMENTS` is empty: ask the user for a one-line summary before proceeding.
- If CHANGELOG.md cannot be written: report the error and show the entry content so the user can paste it manually.
