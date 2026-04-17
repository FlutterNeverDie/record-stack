# 토스 미니앱(Apps-in-Toss) 배포 가이드

이 문서는 Toss 미니앱 프로젝트에서 `deploy` 명령어를 설정하고 실행하는 방법을 설명합니다. 다른 프로젝트의 AI 개발자들이 이 설정을 자동으로 구성할 수 있도록 상세히 가이드합니다.

## 1. 개요
토스 미니앱은 일반적인 웹 배포와 달리, 프로젝트를 `.ait` 확장자의 번들 파일로 빌드한 후 토스 개발자 센터로 업로드해야 합니다. 이를 위해 `granite`와 `ait` CLI 도구를 사용합니다.

## 2. 필수 패키지 설치
프로젝트에 토스 웹 프레임워크가 설치되어 있어야 합니다.

```bash
npm install @apps-in-toss/web-framework --legacy-peer-deps
```

*참고: React 19을 사용하는 경우 `--legacy-peer-deps` 옵션이 필요할 수 있습니다.*

## 3. 설정 파일 작성 (`granite.config.ts`)
프로젝트 루트에 `granite.config.ts` 파일을 생성하여 앱 정보를 설정합니다.

```typescript
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
    appName: 'your-app-name', // 토스 개발자 센터에 등록된 앱 ID
    outdir: 'dist',            // 빌드 결과 출력 디렉토리
    brand: {
        displayName: '앱 이름',
        primaryColor: '#3182F6',
        icon: 'https://static.toss.im/...", // 앱 아이콘 URL
    },
    web: {
        commands: {
            build: 'npm run build', // Vite 등 기존 빌드 명령어
            dev: 'npm run dev',
        },
        port: 5173,
    },
    webViewProps: {
        type: 'partner',
    },
});
```

## 4. `package.json` 스크립트 설정
배포 과정을 자동화하기 위해 `package.json`에 다음 스크립트를 추가합니다.

```json
{
  "scripts": {
    "toss": "npx granite dev",
    "deploy": "npx ait build && npx ait deploy"
  }
}
```

### 각 명령어 설명:
- **`npx ait build`**: `granite.config.ts` 설정을 기반으로 웹 프로젝트를 빌드하고, 최종적으로 `<appName>.ait` 번들 파일을 생성합니다.
- **`npx ait deploy`**: 생성된 `.ait` 파일을 토스 개발자 콘솔로 업로드합니다. 실행 시 최초 1회 로그인이 필요할 수 있습니다.

## 5. 배포 실행 순서
1. **코드 수정 및 빌드 확인**: 로컬에서 `npm run dev`로 충분히 테스트합니다.
2. **배포 명령어 실행**:
   ```bash
   npm run deploy
   ```
3. **인증 (최초 실행 시)**: 터미널에 나타나는 안내에 따라 브라우저에서 토스 계정 로그인을 완료합니다.
4. **업로드 여부 확인**: 배포가 성공하면 터미널에 배포 ID와 함께 테스트 가능한 `scheme` URL(예: `intoss-private://...`)이 출력됩니다. 이 URL을 토스 앱 내 검색창에 입력하여 실기기 테스트를 수행할 수 있습니다.

## 6. 추가 보안 설정 (선택 사항)
만약 앱이 토스 내부 API와 통신해야 한다면 mTLS 인증서 설정이 필요합니다.
- `TOSS_CERT`: PEM 형식의 클라이언트 인증서
- `TOSS_KEY`: PEM 형식의 개인키

이 정보는 Vercel 등의 환경변수에 등록하여 서버 통신 시 사용합니다.

## 7. 트러블슈팅
- **빌드 에러**: `npx granite build`가 실패하면 `dist` 폴더가 정상적으로 생성되었는지, `granite.config.ts`의 `outdir` 설정이 맞는지 확인하세요.
- **권한 에러**: `operation not permitted` 발생 시 `npm cache clean --force`를 시도하거나, 터미널 권한을 확인하세요.
- **로그인 실패**: `npx ait login --force` 명령어로 재로그인을 시도할 수 있습니다.
