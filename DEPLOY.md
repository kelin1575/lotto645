# Neon + Netlify 배포 가이드

## 1. Neon DB 설정

1. [neon.tech](https://neon.tech) 가입 후 새 프로젝트 생성
2. Dashboard → Connection Details에서 연결 문자열 복사
   - **Pooled connection** (앱용): `DATABASE_URL`
   - **Direct connection** (마이그레이션용): `DATABASE_URL_UNPOOLED`

## 2. 데이터베이스 마이그레이션

로컬에서 `.env` 설정 후:

```bash
# 환경변수 설정 (Neon 연결 문자열)
cp .env.example .env
# .env 파일 편집 후

# 마이그레이션 실행
npx prisma migrate deploy

# 관리자 계정 생성
npm run db:seed
```

## 3. Netlify 배포

1. [netlify.com](https://netlify.com) 가입
2. "Add new site" → "Import an existing project" → GitHub 연동
3. **Build settings**:
   - Build command: `npm run build:netlify`
   - Publish directory: `.next`
4. **Environment variables** (Site settings → Environment variables):

```
DATABASE_URL=postgresql://...@ep-xxx.neon.tech/neondb?pgbouncer=true&sslmode=require
DATABASE_URL_UNPOOLED=postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET=랜덤값(openssl rand -base64 32)
NEXTAUTH_URL=https://your-site.netlify.app
ADMIN_EMAIL=admin@yoursite.com
ADMIN_PASSWORD=강력한비밀번호
BANK_NAME=국민은행
BANK_ACCOUNT=123-456-789012
BANK_HOLDER=로또픽
MONTHLY_FEE=9900
```

5. Deploy!

## 4. 주간 당첨번호 자동 수집 (Netlify Scheduled Functions)

Netlify에서 매주 일요일 오전에 자동 실행:
- Netlify → Functions → Scheduled Functions 설정
- 또는 외부 cron 서비스로 `/api/cron/check-winners` POST 호출

## 5. NEXTAUTH_SECRET 생성

```bash
openssl rand -base64 32
```

## 6. 배포 후 확인사항

- [ ] 관리자 로그인 확인 (ADMIN_EMAIL/ADMIN_PASSWORD)
- [ ] 당첨번호 수집 테스트 (`/admin` → 최신 당첨번호 가져오기)
- [ ] 회원가입 → 결제 승인 플로우 테스트
