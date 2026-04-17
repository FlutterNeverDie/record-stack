# 🛵 AppsInToss 2.0 광고 시스템 인수인계 가이드 (ADS_HANDOVER)

이 문서는 본 프로젝트에 적용된 **AppsInToss 2.0 통합 광고 시스템**의 설계 구조와 구현 상세를 설명합니다. 다음 개발자가 광고 기능을 확장하거나 유지보수할 때 이 가이드를 준수해 주세요.

---

## 1. 핵심 컨셉: 하이브리드 광고 (Hybrid Mode)

본 프로젝트는 **AppsInToss 2.0 ver2 통합 SDK**를 사용합니다.
- **동작 원리**: 토스 앱 내부 환경(v5.244.1 이상)에서는 **토스 애즈(Toss Ads)** 가 우선 송출되며, 그 외 일반 브라우저나 낮은 버전의 토스 앱에서는 **구글 애드몹(Google AdMob)** 으로 자동 폴백(Fallback)되어 상시 수익을 보장합니다.
- **라이브러리**: `@apps-in-toss/web-framework`

---

## 2. 광고 유형별 구현 상세

### A. 리워드 광고 (Rewarded Ads)
사용자가 위생 적발 상세 내역을 보기 위해 거쳐야 하는 보상형 광고입니다.

- **적용 위치**: `SearchPage.tsx` -> 식당 클릭 팝업 -> '상세 내역 전체보기' 버튼
- **작업 파일**: `src/hooks/useTossRewardAd.ts`
- **구현 특징**:
  - `userEarnedReward` 이벤트를 수신했을 때만 다음 페이지(`ResultPage`)로 이동시킵니다.
  - 광고 로드 중이거나 미지원 환경일 경우 즉시 보상을 통과시키는 **Defense 로직**이 포함되어 있습니다.
- **테스트 ID**: `ait-ad-test-rewarded-id`

### B. 배너 광고 (Banner Ads)
메인 화면 하단에 고정되거나 리스트 사이에 삽입되는 상시형 광고입니다.

- **적용 위치**: 
  1. `SearchPage.tsx` 최하단 (Fixed)
  2. `SearchResultSection.tsx` 리스트 5번째 아이템마다 (Inline)
- **작업 파일**: 
  - `src/hooks/useTossBanner.ts` (중복 호출 방지 훅)
  - `src/components/common/TossBannerAd.tsx` (공통 컴포넌트)
- **구현 특징 (중요)**:
  - **싱글톤 초기화 패턴**: 여러 배너가 로드될 때 발생하는 `initialization already in progress` 에러를 방지하기 위해 파일 전역 변수와 리스너 셋을 활용하여 SDK 초기화를 단 1회만 수행하도록 설계되었습니다.
- **테스트 ID**: `ait-ad-test-banner-id`

### C. 전면 광고 (Interstitial Ads)
화면 전체를 덮는 광고로, 현재 프로젝트에서는- **작업 파일**: `src/hooks/useTossInterstitialAd.ts`
- **구현 특징**: 
  - 리액트 네이티브가 아닌 **순수 웹뷰(WebView)** 환경에서 에러가 발생하지 않도록 `isSupported` 체크가 포함되어 있습니다.
  - 전면 광고는 보상이 없으므로 `onClose` 콜백을 통해 다음 로직을 즉시 실행합니다.
- **테스트 ID**: `ait-ad-test-interstitial-id`

---

## 3. 요약: 광고 테스트 ID 리스트

| 광고 유형 | 테스트 광고 그룹 ID | 설명 |
| :--- | :--- | :--- |
| **리워드 광고** | `ait-ad-test-rewarded-id` | 상세 보기 잠금 해제용 |
| **리스트형 배너** | `ait-ad-test-banner-id` | 하단 및 리스트 중간용 |
| **피드형 배너** | `ait-ad-test-native-image-id` | 이미지 강조형 배너 |
| **전면 광고** | `ait-ad-test-interstitial-id` | 페이지 전환용 |

---

## 4. 트러블슈팅 및 주의사항

#### 1. "initialization already in progress" 에러
- **원인**: `TossAds.initialize`가 완료되기 전에 다른 컴포넌트에서 또 호출할 경우 발생합니다.
- **해결**: `src/hooks/useTossBanner.ts` 처럼 전역 상태(globalStatus)를 체크하여 `progress` 상태일 때는 대기했다가 완료 후에 실행되도록 이벤트 리스너 방식을 사용해야 합니다.

#### 2. 보상 지급 시점
- 반드시 `onEvent` 콜백 내의 `case 'userEarnedReward'` 시점에 보상 로직을 실행하세요. `dismissed`는 사용자가 그냥 닫았을 때도 발생하므로 주의가 필요합니다.

#### 3. z-index 충돌
- 하단 고정 배너는 `z-index: 40` 이상으로 설정하여 리스트 아이템에 가려지지 않도록 관리합니다.

---
마지막 업데이트: 2026-03-13
