# 🚀 전면 광고(Interstitial) vs 리워드 광고(Reward) 개발 비교 가이드

토스 앱인토스(App-in-Toss) 환경에서 제공하는 통합형 모듈(`IntegratedAd`)을 기준으로, **전면 광고**와 **리워드 광고**의 핵심적인 차이점과 개발 로직 비교를 안내합니다.

## 1. 핵심 차이: API는 같고, ID와 이벤트가 다르다!
앱인토스 SDK 2.0에서 전면 광고와 리워드 광고를 호출하는 함수는 완벽하게 **동일**합니다. 
*   **로드 함수:** `loadFullScreenAd(adGroupId)`
*   **노출 함수:** `showFullScreenAd(adGroupId)`

> 💡 **결정적 차이점:**
> 광고가 "전면 광고(즉시 닫기 가능)"로 작동할지, "리워드 광고(강제 시청 필요)"로 작동할지는 클라이언트 코드가 아니라 **토스 파트너센터 서버에서 발급한 `adGroupId`의 고유 설정**에 의해 전적으로 결정됩니다.

---

## 2. 이벤트 플로우(Event Flow)의 차이

두 광고는 사용자의 목적이 다른 만큼, 코드에서 리스닝(Listening) 해야 하는 필수 이벤트가 전혀 다릅니다.

### 🎯 전면 광고 (Interstitial)
화면 라우팅 전후 등 사용자 경험의 자연스러운 공백이나 트랜지션 중간에 끼워 넣습니다. 사용자가 보기 싫으면 바로 [X]나 [건너뛰기]를 누를 수 있습니다.

*   **포커스 이벤트:** `adClosed` (광고 닫힘)
*   **목적:** 사용자가 광고 창을 닫으면 기존에 하려던 동작(예: 지역 상세 보기, 화면 이동 등)을 "지연 없이 진행" 시키기 위함입니다.
*   **흐름:** `adOpened` ➡️ `adClosed`

### 🎁 리워드 광고 (Rewarded)
사용자가 포인트 획득, 아이템 받기 등 명확한 '보상(Reward)'을 바라고 스스로 버튼을 누를 때 띄웁니다. 사용자는 일정 시간(15~30초) 동안 동영상을 끝까지 시청해야만 보상을 얻을 수 있습니다.

*   **포커스 이벤트:** `userEarnedReward` (광고 시청 조건 100% 충족)
*   **목적:** 이 이벤트가 호출된 이력이 있는지 검사한 후, 참(True)일 때만 유저의 DB 수치를 올려주거나 쿠폰을 발행하는 로직을 작동시키기 위함입니다.
*   **흐름:** `adOpened` ➡️ **`userEarnedReward` (필수 달성 지점)** ➡️ `adClosed`

---

## 3. 리액트(React) 코드 구현 로직 비교

### [A] 전면 광고 (무조건 다음으로 넘기기)
보상 개념이 없으므로 "광고 노출이 끝나면 그냥 할 거 해라"라는 식으로 콜백을 구성합니다.

```typescript
const showInterstitialAd = async (onNextAction: () => void) => {
  try {
    const adController = await showFullScreenAd(AD_CONFIG.INTERSTITIAL_ID); // 전면 광고 전용 ID
    
    const unsubscribe = adController.subscribe((event) => {
      // 💡 [핵심] 닫히거나, 중간에 오류가 나서 못 떴어도 앱 흐름을 막으면 안 됨!
      if (event.name === 'adClosed' || event.name === 'adFailedToShow') {
        onNextAction(); // 원래 가려던 페이지로 즉시 이동
        unsubscribe(); 
      }
    });
  } catch (error) {
    onNextAction(); // 통신 오류 시에도 막히지 않도록 안전망 (Fallback) 처리
  }
};
```

### [B] 리워드 광고 (먹튀 방지 로직)
유저가 보상을 받을 권리가 생겼는지 확인하는 플래그(`isRewarded`) 변수 추적이 필수입니다.

```typescript
const showRewardAd = async (onRewardSuccess: () => void, onRewardFail: () => void) => {
  try {
    const adController = await showFullScreenAd(AD_CONFIG.REWARD_ID); // 리워드 광고 전용 ID
    
    // 💡 [핵심] 보상을 진짜로 받았는지 체크하는 자물쇠 (기본값: false)
    let isRewarded = false; 
    
    const unsubscribe = adController.subscribe((event) => {
      // 1. 영상 시청 완료 선언! (그러나 광고 창이 아직 안 닫혔을 수 있음)
      if (event.name === 'userEarnedReward') {
        isRewarded = true; // 자물쇠 해제 🔓
      }
      
      // 2. 사용자가 최종적으로 [X]를 눌러서 메인으로 돌아왔을 때
      if (event.name === 'adClosed') {
        if (isRewarded) {
          onRewardSuccess(); // 진짜 보상 지급 (API 호출)
        } else {
          onRewardFail();    // "1초 남았는데 껐네? 국물도 없음" 처리
        }
        unsubscribe();
      }
    });
  } catch (error) {
    onRewardFail(); // 예초에 광고가 막혔을 때
  }
};
```

---

## 4. 최종 요약

| 구분 | 전면 광고 (Interstitial) | 리워드 광고 (Rewarded) |
| :--- | :--- | :--- |
| **발동 함수** | `showFullScreenAd` | `showFullScreenAd` (완전 동일) |
| **지급 ID 종류** | 즉시 패스 가능한 ID | 조건에 락(Lock)이 걸린 ID |
| **보유 이벤트** | `adClosed` 하나면 충분 | `userEarnedReward` 추적 필수 |
| **사용처 명분** | 앱 내 잦은 화면 이동 중 노출 | "광고 보고 100원 받기" 등 확실한 트리거 |
