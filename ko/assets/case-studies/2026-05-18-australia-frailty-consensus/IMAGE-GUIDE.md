# 이미지 제작 가이드
## 위치: `docs/case-studies/frailty-policy/2026-05-18-australia-frailty-consensus/img/`

---

## 1. 대문(Hero) 이미지 — `cover.webp`

### 용도
- 기사 최상단 히어로 이미지
- `cases.json` 카드 썸네일 (16:9 비율로 크롭)
- OG 이미지(소셜 미리보기)

### 규격
| 항목 | 값 |
|------|-----|
| 파일명 | `cover.webp` |
| 권장 해상도 | 1600 × 900 px |
| 비율 | 16:9 |
| 포맷 | WebP (quality 80–85) |
| 최대 파일 크기 | 250 KB |

### 시각적 컨셉
**"지역사회 안에서 이어지는 노쇠 예방의 연결고리"**

밝고 따뜻한 톤. 지역사회(공원, 커뮤니티 공간)를 배경으로 고령자가 활동하는 장면. 단순히 '아픈 노인'이 아니라 활동적이고 연결된 고령자 이미지.

### 구성 요소
- **배경**: 호주 느낌의 밝은 자연광, 공원 혹은 지역사회 센터 공간. 테알(teal, #0d9488) 계열 포인트 색상.
- **주요 피사체**: 60~75세 고령자 1~2명. 걷기·스트레칭·가벼운 운동 또는 사회적 교류 장면. 단독보다는 타인과 함께하는 장면 선호.
- **텍스트 오버레이** (선택사항, 오른쪽 하단 또는 좌하단):
  - 영문 소문자: `community frailty management`
  - 연도: `2026`
  - 배경 반투명 어두운 박스 위에 흰색 폰트
- **피해야 할 요소**: 병원 침대·의료 장비·약품 등 임상적 이미지. 슬프거나 고통스러운 표정. 과도한 텍스트.

### 색상 팔레트
- Primary: `#0d9488` (teal-600)
- Accent: `#f59e0b` (amber-500)
- 배경: 밝은 아이보리·크림 또는 자연광
- 텍스트 오버레이: `rgba(15, 23, 42, 0.65)` 위 `#ffffff`

### AI 이미지 생성 프롬프트 (참고)
```
Warm, bright community scene with 1-2 active older adults (60-75 years) 
in a sunny park or community center. One person doing gentle stretching 
or walking, another engaging in conversation. Australian-style outdoor 
setting with natural light. Clean, optimistic health promotion aesthetic. 
Teal and warm amber accent colors. No hospital equipment, no sad expressions. 
16:9 landscape format, photo-realistic style.
```

---

## 2. 본문 인용 이미지 — `australia-frailty-framework.webp`

### 용도
- 기사 본문 Section 4("6개 영역 19개 권고문 개요") 아래 삽입
- 논문 Figure 1의 재현 인포그래픽
- 출처 캡션: "Chopra et al. Medical Journal of Australia, 2026"

### 규격
| 항목 | 값 |
|------|-----|
| 파일명 | `australia-frailty-framework.webp` |
| 권장 해상도 | 1200 × 800 px |
| 비율 | 3:2 (또는 4:3) |
| 포맷 | WebP (quality 85) |
| 최대 파일 크기 | 180 KB |

### 내용 설명
논문 Figure 1 "Integrated framework of recommendations across six domains"의 인포그래픽 재현.

**중앙 핵심 개념**: `지역사회 거주 고령자 (Community-Dwelling Older Adults)`

**6개 영역 (중앙을 둘러싼 원형 또는 방사형 배치)**:

| 번호 | 영역명 | 영문 | 색상 |
|------|--------|------|------|
| 1 | 건강증진·선별 | Health Promotion & Screening | Teal #0d9488 |
| 2 | 영양 | Nutrition | Amber #f59e0b |
| 3 | 운동 | Exercise | Blue #3b82f6 |
| 4 | 사회적 처방 | Social Prescribing | Rose #f43f5e |
| 5 | 약물 최적화 | Optimisation of Medicines | Violet #8b5cf6 |
| 6 | 중증 노쇠 관리 | Management of Severe Frailty | Slate #64748b |

**레이아웃 구성 (권장: 육각형 또는 원형 방사형)**

```
          [건강증진·선별]
    [중증 노쇠 관리]     [영양]
         [지역사회
          거주 고령자]
    [약물 최적화]     [운동]
          [사회적 처방]
```

또는 좌→우 흐름형(화살표):
```
선별 → 영양 + 운동 + 사회적 처방 + 약물 최적화 → [경도] → [중등도] → [중증 관리]
```

**각 영역 카드 내부 요소**:
- 아이콘 (이모지 또는 라인 아이콘)
- 영역명 (한국어 + 영문)
- 권고문 수 (예: "3개 권고문")
- 합의 수준 뱃지 (예: A등급, B등급)

**하단 추가 정보**:
- 소제목: "Clinical Frailty Scale 기반 3단계 — 경도(CFS 4–5) / 중등도(CFS 6) / 중증(CFS 7–8)"
- 출처: "Chopra et al., Medical Journal of Australia, 2026 | doi:10.5694/mja2.70182"

### 디자인 톤
- 배경: 흰색 또는 밝은 회색(#f8fafc)
- 중앙 원: Teal 계열 (#0d9488) 밝은 버전
- 폰트: Sans-serif, 깔끔한 정보 디자인
- 전체적으로 NOFRAILTY 위키 스타일(teal 포인트, 깔끔한 카드 UI)과 일치

### 도구 추천
- **Figma / Canva**: 인포그래픽 작성 후 WebP 내보내기
- **Python (matplotlib)**: 프로그래밍 방식 생성 가능
- **AI 이미지**: 정보 정확성이 중요하므로 직접 디자인 권장

---

## 업로드 체크리스트
- [ ] `cover.webp` → `docs/case-studies/frailty-policy/2026-05-18-australia-frailty-consensus/img/cover.webp`
- [ ] `australia-frailty-framework.webp` → `docs/case-studies/frailty-policy/2026-05-18-australia-frailty-consensus/img/australia-frailty-framework.webp`
- [ ] WebP 포맷 확인 (PNG/JPG → WebP 변환 필요 시 `cwebp` 또는 Squoosh 사용)
- [ ] `cases.json` 썸네일 경로: `"cover": "./2026-05-18-australia-frailty-consensus/img/cover.webp"`
