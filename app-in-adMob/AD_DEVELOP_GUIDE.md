# 🛵 AppsInToss 2.0 광고 개발 및 운영 가이드 (AD_DEVELOP_GUIDE)

이 문서는 토스 인앱 광고 2.0(Integrated SDK)의 **개발 정책, UI 가이드, 운영 원칙**을 정리한 통합 가이드입니다. 프로젝트 유지보수 및 출시 검수 시 이 원칙을 반드시 준수해야 합니다.

---

## 1. 광고 운영 원칙 (Quality Assurance)

광고는 수익 수단인 동시에 사용자 경험(UX)의 일부입니다. 토스의 주요 UX 원칙을 준수하세요.

| 원칙 | 설명 | 적용 예시 |
| :--- | :--- | :--- |
| **Simplicity** | 광고는 명료해야 함 | "상세 보기", "광고 시청" 등 명확한 CTA 사용 |
| **No Deception** | 예상치 못한 순간/형태로 등장 금지 | **서비스 진입 직후 전면 광고 절대 금지** |
| **Value First** | 목표 달성을 방해하지 않음 | **결제/인증 흐름 중 광고 삽입 금지** |

---

## 2. 금지 행위 및 정책 (Red Rules)

위반 시 광고 노출이 제한되거나 정산이 보류될 수 있습니다.

- **UI 조작 금지**: "추천 서비스", "금융 팁" 등 광고가 아닌 것처럼 위장하는 행위 금지. (반드시 **"ad"** 표기 유지)
- **로직 변조 금지**: SDK 기본 클릭/노출 이벤트를 가로채거나 임의로 수정 금지.
- **클릭 유도 금지**: "클릭 시 포인트 지급" 등 클릭에 대한 직접적인 보상 문구 추가 금지.
- **광고 겹침 금지**: 다른 UI 요소가 광고를 가리거나 광고 위에 덮이지 않도록 구현.

---

## 3. 배너 광고 UI 구현 가이드

배너 광고는 **고정형(Fixed)** 과 **인라인(Inline)** 두 가지 방식으로 운영됩니다.

### A. 리스트형 배너 (List-type)
- **고정형 (하단 고정 등)**: `height: 96px` 권장.
- **인라인 (리스트 사이)**: 높이를 고정하지 않음 (자동 조절).
- **스타일 추천**: 
  - `variant: 'card'`: 둥근 모서리가 있는 카드 형태로 리스트 아이템과 조화로움.
  - `tone: 'blackAndWhite'`: 범용적인 흰색/검정색 배경.

### B. 피드형 배너 (Feed-type)
- **이미지 강조형**: 대형 이미지가 포함된 배너.
- **고정형 사용 시**: `height: 300px` 권장.
- **위치**: 스크롤이 가능한 화면에만 권장하며, 위아래 여백을 **8px 이상** 확보해야 함.

---
 
## 4. 테스트 광고 ID 리스트 (출시 전 확인 필수)

개발 단계에서는 반드시 아래의 테스트 ID를 사용해야 합니다. 실제 ID 사용 시 정책 위반으로 간주될 수 있습니다.

- **전면 광고**: `ait-ad-test-interstitial-id`
- **리워드 광고**: `ait-ad-test-rewarded-id`
- **리스트 배너**: `ait-ad-test-banner-id`
- **피드 배너**: `ait-ad-test-native-image-id`

---

## 5. 출시 전 QA 체크리스트

1. [ ] **전입 직후 전면 광고 노출 여부**: 앱 실행 직후에 광고가 바로 뜨지 않는가?
2. [ ] **인증/결제 흐름 방해 여부**: 중요한 사용자 액션 흐름 사이에 광고가 끼어있지 않은가?
3. [ ] **제거(Cleanup) 로직**: `useEffect` 언마운트 시 `banner.destroy()`가 호출되는가?
4. [ ] **리워드 지급 시점**: `userEarnedReward` 이벤트를 정확히 감지하여 보상을 주는가?

---
## 6. 트러블슈팅 및 주의사항 (Troubleshooting)

개발 및 리팩토링 시 가장 실수하기 쉬운 항목들을 정리했습니다.

### ⚠️ 함수명 혼동 주의 (CRITICAL)
- **사용 금지**: `loadFullScreenAd`, `showFullScreenAd` (일부 환경에서 브릿지 미작동 가능성)
- **사용 필수**: **`GoogleAdMob.loadAppsInTossAdMob`**, **`GoogleAdMob.showAppsInTossAdMob`**
  - 반드시 `GoogleAdMob` 네임스페이스를 통해 호출해야 토스 앱 내 광고 브릿지가 정상적으로 연결됩니다.

### ⚠️ 광고 로드-노출 순서 (Preload Rule)
- 광고는 반드시 **미리 로드(Load)된 상태**에서만 보여줄(Show) 수 있습니다.
- `loaded` 이벤트를 받은 후 `show`를 호출하는 로직이 보장되어야 합니다. 로드되지 않은 상태에서 호출 시 아무 동작도 하지 않거나 에러가 발생할 수 있습니다 (Fallback 로직 필수).

### ⚠️ 환경 지원 체크 (Safe Call)
- 모든 API 호출 전에는 반드시 `.isSupported()`를 확인하여 앱 외부(일반 브라우저/로컬)에서의 크래시를 방지하세요.
  ```typescript
  if (GoogleAdMob.loadAppsInTossAdMob.isSupported()) { ... }
  ```

### ⚠️ 배너 광고 "흰 화면" 문제
- 배너 광고 컨테이너에 **최소 높이(min-height)**가 지정되지 않으면 광고가 로드되어도 화면에 보이지 않아 "흰 화면"으로 보일 수 있습니다. (리스트 배너: 96px, 피드 배너: 410px 권장)

### ⚠️ 광고 ID 관리
- 광고 ID는 반드시 `src/constants/adConfig.ts`에서 중앙 관리하세요. 
- 테스트 중에는 `ait-ad-test-`로 시작하는 ID를 사용하고, 출시 직전에 실제 ID로 교체하는 것을 잊지 마세요.

---
**최종 업데이트**: 2026-03-13  
**문서 출처**: [AppsInToss 공식 가이드](https://developers-apps-in-toss.toss.im/ads/develop.md)




# 📢 AppsInToss Ad Integration Guide (AdMob 2.0)

이 문서는  프로젝트의 토스 인앱 광고 통합 방식과 핵심 코드를 설명합니다. 다른 에이전트나 개발자가 광고 기능을 확장하거나 유지보수할 때 이 가이드를 따르세요.

---

## 1. 광고 종류 및 테스트 ID

토스 인앱 광고 2.0 (AdMob 기반)은 아래 4가지 테스트 ID를 사용하여 환경에 맞는 배너/전면 광고를 노출합니다.

| 광고 유형 | 테스트 ID (adGroupId) | 적용 위치 |
| :--- | :--- | :--- |
| **전면형 (Interstitial)** | `ait-ad-test-interstitial-id` | (현재 제거됨 - 필요 시 복구 가능) |
| **리워드형 (Rewarded)** | `ait-ad-test-rewarded-id` | 검색 리스트 -> 상세 진입 시 '상세보기' 버튼 |
| **배너 (문구 강조형)** | `ait-ad-test-banner-id` | 검색 메인 하단 고정 (띠 배너) |
| **배너 (이미지 강조형)** | `ait-ad-test-native-image-id` | 검색 리스트 사이, 상세 페이지 중단 카드 |

---

## 2. 핵심 배너 컴포넌트 (`TossBannerAd.tsx`)

배너 광고의 핵심은 **환경 감지**와 **명시적 초기화**입니다. 아래 패턴을 반드시 유지해야 흰 화면 이슈를 방지할 수 있습니다.

### 핵심 구현 포인트
1.  **Environment Check**: `isTossApp`과 `isLocal`을 확인하여 토스 앱 WebView에서만 로직이 실행되도록 방어합니다.
2.  **Explicit Init**: 배너를 부착(`attach`)하기 전, `TossAds.initialize`를 호출하여 브릿지를 활성화합니다.
3.  **Mock UI**: 로컬/웹 환경에서는 광고 영역에 점선 박스와 ID를 표시하여 개발 편의성을 제공합니다.
4.  **Min-Height**: `minHeight`를 강제 지정하여 인스턴스 로딩 전 레이아웃 붕괴를 막습니다.

```tsx
// src/components/common/TossBannerAd.tsx
useEffect(() => {
    const isTossApp = /Toss/i.test(navigator.userAgent);
    if (!isTossApp && isLocal) return; // 웹 환경 방어

    // 1. 초기화 (initialize)
    const globalAds = (TossAds as any);
    globalAds.initialize?.({ /* callbacks... */ });

    // 2. 부착 (attach)
    const attachFn = globalAds.attachBanner || globalAds.attach;
    attachFn?.(adGroupId, bannerRef.current, {
        variant, // 'card' 또는 'expanded'
        theme: 'light',
        tone: 'blackAndWhite'
    });

    return () => { globalAds.destroyAll?.(); }; // 정리 로직 필수
}, [adGroupId, variant]);
```

---

## 3. 리워드 광고 워크플로우 (`useTossRewardAd.ts`)

리워드 광고는 배너와 달리 **미리 로드(Preload)**한 뒤, 유저 액션 시점에 **노출(Show)**하는 2단계 프로세스로 작동합니다.

1.  **로드 (`loadAppsInTossAdMob`)**: 상세 정보 팝업이 뜰 때 혹은 페이지 로드 시점에 미리 로드합니다.
2.  **노출 (`showAppsInTossAdMob`)**: 유저가 버튼을 클릭하면 저장된 광고를 보여주고, 완료 후 콜백을 실행합니다.

```tsx
// 예시: 리워드 광고 실행 시점
const handleShowAd = () => {
    showAd(() => {
        // 광고 시청 완료 후 실행될 비즈니스 로직
        navigate('/result');
    });
};
```

---

## 4. UI/UX 원칙

*   **배너 위치 가이드**:
    *   `variant="expanded"`: 화면 하단에 끈 형태(띠 배너)로 고정할 때 사용합니다.
    *   `variant="card"`: 리스트 내부에 삽입하거나 컨텐츠 사이에 자연스럽게 배치할 때 사용합니다. (최소 높이 180px 권장)
*   **광고 피로도 조절**: 현재 상세 페이지에서 퇴거 시(닫기 버튼)에는 광고를 제거하여 유저 이탈을 방지하고 있습니다.

---

## 5. 실기기 테스트 및 배포

1.  **로컬 테스트**: `npm run dev` 실행 시 광고 영역이 회색 점선 박스로 표시되면 정상입니다.
2.  **배포**: `npm run deploy` 명령어를 통해 토스 서버로 빌드 결과물을 전송하십시오.
3.  **실기기 확인**: 실제 토스 앱 WebView에서는 테스트 ID에 해당하는 광고가 실제 렌더링됩니다.

> [!IMPORTANT]
> 실제 상용 배포 전에는 반드시 `granite.config.ts` 및 관련 코드의 `adGroupId`를 토스 디벨로퍼 센터에서 발급받은 **상용 ID**로 교체해야 합니다.

