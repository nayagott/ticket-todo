# TicketTodo 디자인 시스템 (Design System)

본 문서는 Trello의 UI/UX 패턴과 첨부된 TicketTodo 칸반 보드 이미지를 바탕으로 작성된 디자인 시스템 가이드라인입니다.

## 1. 색상 팔레트 (Color Palette)

화면의 시각적 계층 구조를 명확히 하고, 사용자의 인지 부하를 줄이기 위해 명도 대비가 뚜렷한 색상들을 사용합니다.

### 1.1. 브랜드 및 기본 색상 (Brand & Base Colors)
* **Primary Blue:** `#0052CC` (Trello 브랜드 블루) - 주요 액션 버튼(예: '+ 새 업무'), 활성화된 링크 등에 사용.
* **Background Gray:** `#F4F5F7` - 칸반 보드의 전체 배경색. 카드와의 구분을 위해 약간의 음영이 들어간 쿨그레이 색상.
* **Surface White:** `#FFFFFF` - 칸반 카드, 필터 버튼, 보드 컬럼 배경(옵션) 등 콘텐츠가 담기는 기본 표면.
* **Text Primary:** `#172B4D` - 헤더, 카드 제목 등 주요 텍스트.
* **Text Secondary:** `#5E6C84` - 카드 설명, 부가 정보 등 보조 텍스트.

### 1.2. 상태 및 우선순위 색상 (Status & Priority Colors)
업무의 중요도와 상태를 직관적으로 파악할 수 있도록 뱃지(Badge)에 적용됩니다.
* **High (높음):** 배경 `#FFEBE6` / 텍스트 `#BF2600` (Red 계열)
* **Medium (중간):** 배경 `#DEEBFF` / 텍스트 `#0747A6` (Blue 계열)
* **Low (낮음):** 배경 `#DFE1E6` / 텍스트 `#42526E` (Gray 계열)
* **Highlight Border:** `#FF5630` (강조/지연 표시용 붉은색 테두리), `#FFAB00` (진행중/주의 표시용 오렌지색 테두리)

## 2. 타이포그래피 (Typography)

* **Font Family:** Pretendard, Inter, 또는 시스템 기본 산세리프 폰트 (맑은 고딕, Apple SD Gothic Neo).
* **Header (로고/타이틀):** 24px, Bold
* **Column Title (컬럼 제목):** 16px, Semi-Bold (예: Backlog, TODO)
* **Card Title (카드 제목):** 14px, Medium
* **Card Description (카드 설명):** 12px, Regular
* **Badge Text (뱃지 텍스트):** 11px, Semi-Bold

## 3. UI 컴포넌트 (UI Components)

### 3.1. 버튼 (Buttons)
* **Primary Button:** 배경색 Primary Blue, 텍스트 White, 둥근 모서리(Radius 4px~8px), 호버 시 명도 감소.
* **Filter Pill (필터 버튼):** 배경색 Surface White, 테두리 1px Solid `#DFE1E6`, 텍스트 Text Secondary, 완전한 둥근 모서리(Radius 16px 이상). (예: '이번주 업무')

### 3.2. 칸반 카드 (Kanban Card)
* **컨테이너:** 배경색 White, 모서리 둥글기(Radius 8px), 부드러운 그림자(Box-shadow: `0 1px 2px rgba(0,0,0,0.1)`).
* **여백(Padding):** 내부 여백 12px ~ 16px.
* **인터랙션:** 마우스 호버 시 배경색 약간 어두워짐(예: `#FAFBFC`) 또는 커서 변경(Pointer)으로 드래그 앤 드롭 가능성 암시.
* **상태 테두리 (State Borders):**
    * 기본: 테두리 없음 또는 아주 연한 회색 (`#DFE1E6`).
    * 주의/경고 (예: 일정이 초과된 업무): 2px Solid Red.
    * 진행/포커스 (예: 현재 작업 중인 업무): 2px Solid Orange.

### 3.3. 컬럼 (Column)
* **너비:** 고정 너비 (예: 280px ~ 300px).
* **배경:** 배경색과 동일하거나 약간 더 어두운 회색.
* **배치:** 수평 스크롤(Horizontal Scroll)이 가능하도록 Flex 레이아웃 적용. 내부 카드는 수직 스크롤(Vertical Scroll) 적용.

## 4. 레이아웃 (Layout)
* **GNB (Global Navigation Bar):** 좌측에 'TicketTodo' 로고, 우측에 '+ 새 업무' 버튼 배치.
* **Sub-header:** GNB 하단에 '이번주 업무', '일정이 초과된 업무' 등의 필터 영역 배치.
* **Board Area:** 남은 하단 영역 전체를 차지하며, 컬럼들이 좌측부터 우측으로 나열됨.
