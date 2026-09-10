# 이미지 제작 가이드
## 위치: `docs/case-studies/frailty-policy/2026-05-19-lancet-accelerated-frailty-deficit/img/`

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
**"조용히 쌓이다, 어느 순간 급격히 — 가속적 결손 축적의 개념"**

추상적·개념적 이미지. 사람이 아니라 **그래프/곡선 시각화**를 중심으로, 노쇠가 어느 시점을 기점으로 급격히 변하는 궤적을 표현한다.

### 구성 옵션 (택 1)

**옵션 A: 그래프 개념 이미지**
- 배경: 짙은 네이비 또는 다크 그레이(#0f172a)
- 중앙에 부드러운 곡선 여러 개:
  - 하나는 완만하게 올라가는 선(점진적, 흰색 또는 밝은 회색)
  - 하나는 중간에서 급격히 꺾이는 선(가속적, 붉은색 또는 주황색 #ef4444 또는 #f97316)
  - 꺾이는 지점에 빛나는 포인트(dot) 강조
- 오른쪽 아래에 작은 흰색 텍스트: "Lancet Healthy Longevity · 2026"
- 전체적으로 데이터 시각화·헬스테크 느낌

**옵션 B: 사람 + 시간 흐름 이미지**
- 배경: 흐릿한 노인의 손 또는 실루엣 (따뜻한 세피아 또는 모노크롬)
- 상단에 반투명하게 흐르는 시간 그래프 오버레이
  - 완만한 구간(흰색) → 가속 구간(붉은색/오렌지) 전환점 표시
- 차분하고 의미 있는 느낌. "어느 시점부터 빠르게 나빠진다"는 서사

### 색상 팔레트
- 다크 배경 계열: `#0f172a`, `#1e293b`
- 포인트 (가속 선): `#ef4444` (red-500) 또는 `#f97316` (orange-500)
- 점진적 선: `#94a3b8` (slate-400)
- 텍스트: `#f1f5f9` (slate-100)

### AI 이미지 생성 프롬프트 (참고)
```
Abstract data visualization concept image showing two health trajectories on a dark 
navy background. One smooth, gradually rising line in light gray. Another line that 
starts similar then suddenly steepens upward with a glowing inflection point in red-orange. 
Clean, minimal data science aesthetic. No people, no text except small source attribution. 
16:9 landscape format. Dark tech / health data style.
```

---

## 2. 본문 인용 인포그래픽 — `deficit-trajectory-types.webp`

### 용도
- 기사 본문 Section 9("결손 4개 유형의 누적 궤적 — Figure 1 해설") 아래 삽입
- 논문 Figure 1을 해설 인포그래픽으로 재현
- 출처 캡션: "Johnson et al. Lancet Healthy Longevity, 2026"

### 규격
| 항목 | 값 |
|------|-----|
| 파일명 | `deficit-trajectory-types.webp` |
| 권장 해상도 | 1200 × 700 px |
| 비율 | 약 17:10 |
| 포맷 | WebP (quality 85) |
| 최대 파일 크기 | 180 KB |

### 내용 설명
논문 Figure 1의 핵심을 한국어 해설 인포그래픽으로 재현.

**전체 레이아웃**: 2×2 그리드 (4개 유형 카드)

---

**유형 A — 점진적 축적 (91% 해당)**
- 배경: 연한 초록(#f0fdf4)
- 그래프: 단일 완만한 오름 직선 (검은색 또는 짙은 회색)
- 한국어 설명:
  - 제목: "A. 점진적 축적 (91%)"
  - 부제: "9년간 일정한 속도로 결손 증가"
  - 예시 결손: 고혈압 → 당뇨 → 빈혈 → 시각장애 → 만성콩팥병 (나이와 함께 차례로)

**유형 B — 중장년기 가속 (65세 미만 시작, 26%)**
- 배경: 연한 주황(#fff7ed)
- 그래프: 초반 완만 → 50~60대에 가파른 구간(붉은 선) → 이후 안정
- 가속 시 대표 결손: 만성콩팥병, 다약제 복용, 허혈성 심질환
- 한국어 설명:
  - 제목: "B. 중장년기 가속 (65세 미만 시작)"
  - 부제: "평균 가속 발생 연령: 58.8세"

**유형 C — 70대 가속 (65–80세 시작, 51%)**
- 배경: 연한 주황-빨강(#fff1f2)
- 그래프: 완만 → 70대 중반에 급격한 꺾임(붉은 선)
- 가속 시 대표 결손: 다약제 복용, 심방세동, 심부전, 호흡곤란, 이동 문제
- 한국어 설명:
  - 제목: "C. 70대 가속 (65–80세 시작, 가장 흔함)"
  - 부제: "평균 가속 발생 연령: 72.5세"

**유형 D — 80세 이상 가속 (19%)**
- 배경: 연한 보라-빨강(#fdf2f8)
- 그래프: 완만 → 80대 이후 급격한 꺾임(붉은 선) → 예후 가장 나쁨
- 가속 시 대표 결손: 다약제 복용, 심부전, 인지·기억 문제, 이동 문제, 낙상
- 한국어 설명:
  - 제목: "D. 80세 이상 가속 — 예후 최악"
  - 부제: "2년 내 사망률 35.7%, 입원율 61.0%"

---

**하단 공통 범례**
- 검은 선: 점진적 축적 구간
- 붉은 선: 가속적 축적 구간 (기울기 최대)
- 점(●): 가속 시작 지점
- 출처 텍스트: "Johnson et al., Lancet Healthy Longevity 2026 · NOFRAILTY wiki"

### 디자인 톤
- 배경 전체: 흰색 (#ffffff)
- 카드 배경: 각 유형별 연한 색상 (위 참조)
- 그래프 선: 검은색 = #1e293b, 가속 = #ef4444
- 폰트: Sans-serif, 깔끔한 인포그래픽 스타일
- 전체적으로 NOFRAILTY 위키 스타일과 일치

### 도구 추천
- **Figma / Canva**: 4개 카드 그리드 → 각 카드 내 소형 그래프 (Path/Line 객체) → WebP 내보내기
- **Python (matplotlib)**: 4개 subplot 생성 후 `savefig('...webp')`
  ```python
  # 대략적인 코드 구조
  import matplotlib.pyplot as plt
  fig, axes = plt.subplots(2, 2, figsize=(12, 7))
  # 각 ax에 piecewise linear 선 그리기
  # 붉은 구간은 ax.plot(..., color='#ef4444', linewidth=2.5)
  plt.savefig('deficit-trajectory-types.webp', format='webp', dpi=150)
  ```

---

## 업로드 체크리스트
- [ ] `cover.webp` → `docs/case-studies/frailty-policy/2026-05-19-lancet-accelerated-frailty-deficit/img/cover.webp`
- [ ] `deficit-trajectory-types.webp` → `docs/case-studies/frailty-policy/2026-05-19-lancet-accelerated-frailty-deficit/img/deficit-trajectory-types.webp`
- [ ] WebP 포맷 확인 (PNG/JPG → WebP 변환 시 `cwebp` 또는 Squoosh 사용)
- [ ] `cases.json` 썸네일 경로: `"cover": "./2026-05-19-lancet-accelerated-frailty-deficit/img/cover.webp"`
