# Changelog

모든 주요 변경 이력을 기록합니다.  
형식: `/changelog "요청 내용"` 으로 항목 추가.

---

## [main] - 2026-06-22 16:20

### 🎯 Prompt

> "지금 수정 내역을 반영한 뒤 커밋 메시지를 만들어서 푸시하고 기록해줘. changelog를 통해 update 문서나 코드들 리스트업해서 알려줘. 제대로 반영되는 건지 확인해보고 싶어."

### ✅ Changes

- **Added**: `/changelog` Skill 파일 생성 (`.claude/skills/changelog/SKILL.md`)
- **Added**: 프로젝트 변경 이력 파일 초기화 (`CHANGELOG.md`)
- **Modified**: `## 최근 변경사항` 섹션 추가 — 14일 롤링 윈도우 테이블 (`AGENTS.md`)
- **Modified**: `.gitignore`에 민감 파일·임시 파일 패턴 추가

### 📁 Files Modified

| 파일 | 추가 | 삭제 |
|------|------|------|
| `.claude/skills/changelog/SKILL.md` **[신규]** | +167 | -0 |
| `CHANGELOG.md` **[신규]** | +65 | -0 |
| `AGENTS.md` | +13 | -0 |
| `.gitignore` | +5 | -0 |

### 🧪 Tests

(테스트 미실행)

### 🔗 Commit

`(pending)` on `main`

---

## [main] - 2026-06-22 16:17

### 🎯 Prompt

> "매번 프롬프트 입력 후 코드를 수정하고 git에 반영할 때 자동으로 기록하는 /changelog Skill 생성 — CHANGELOG.md 상세 이력 + AGENTS.md 최근 변경사항 자동 갱신"

### ✅ Changes

- **Added**: `/changelog` Skill 정의 파일 생성 — 프롬프트·파일 통계·브랜치·타임스탬프·테스트 결과를 구조화하여 기록 (`.claude/skills/changelog/SKILL.md`)
- **Added**: 프로젝트 변경 이력 파일 초기화 (`CHANGELOG.md`)
- **Modified**: AGENTS.md에 `## 최근 변경사항` 섹션 추가 — 14일 롤링 윈도우 자동 갱신 테이블 (`AGENTS.md`)

### 📁 Files Modified

| 파일 | 추가 | 삭제 |
|------|------|------|
| `.claude/skills/changelog/SKILL.md` **[신규]** | +167 | -0 |
| `CHANGELOG.md` **[신규]** | +33 | -0 |
| `AGENTS.md` | +12 | -0 |

### 🧪 Tests

(테스트 미실행)

### 🔗 Commit

`4d53013` on `main`

---

## [main] - 2026-06-22 16:16

### 🎯 Prompt

> "/changelog Skill 구현 시스템 추가 — 매번 프롬프트 입력 후 코드 반영 시 CHANGELOG.md와 AGENTS.md를 자동 갱신하는 /changelog 커맨드 Skill 생성"

### ✅ Changes

- **Added**: `/changelog` Skill 파일 생성 — 프롬프트 요약, 변경 파일 통계, 브랜치/타임스탬프, 테스트 결과를 CHANGELOG.md에 기록하고 AGENTS.md 최근 변경사항 섹션을 자동 갱신 (`.claude/skills/changelog/SKILL.md`)

### 📁 Files Modified

| 파일 | 추가 | 삭제 |
|------|------|------|
| `.claude/skills/changelog/SKILL.md` **[신규]** | +167 | -0 |

### 🧪 Tests

(테스트 미실행)

### 🔗 Commit

`4d53013` on `main`

---
