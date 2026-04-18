// MSO ERP - 웹앱 진입점, 라우터, 공통 유틸
// 배포: Apps Script 편집기 → 배포 → 새 배포 → 웹앱
//       실행 계정: 나(소유자) / 액세스: 모든 사용자
//
// [외부 사용자 인증 흐름]
// Execute-as-Me 환경에서 Session.getActiveUser().getEmail()은
// 스크립트 소유자와 다른 도메인 사용자에게 빈 문자열을 반환함.
// 해결: Google Identity Services(GSI) ID 토큰 검증 후 서버 세션 nonce 발급.
// 1) doGet → 빈 이메일 → buildSignInPage_() 반환
// 2) 클라이언트: GSI 버튼 클릭 → credential JWT → initSession() 호출
// 3) initSession(): tokeninfo API 검증 → email 확인 → nonce 생성 → CacheService 저장(6h)
// 4) 클라이언트: nonce를 URL 파라미터(?_sessionNonce=)로 전달해 doGet 재호출
// 5) doGet: nonce로 CacheService에서 email 복원 → 정상 앱 렌더링
// 6) handleClientRequest: data.__nonce로 동일하게 email 복원
//
// [임시 개발 우회]
// URL에 ?_ownerBypass=1 추가 → Session.getEffectiveUser()로 소유자 이메일 사용
// 운영 배포 전 반드시 제거할 것

// ─── doGet: 모든 페이지 요청 진입점 ──────────────────────────

function doGet(e) {
  const rawActive    = Session.getActiveUser().getEmail();
  const rawEffective = Session.getEffectiveUser().getEmail();

  // 개발용 소유자 우회: ?_ownerBypass=1
  const ownerBypass  = (e && e.parameter._ownerBypass === '1');

  // GSI 세션 nonce: ?_sessionNonce=<uuid>
  const sessionNonce = (e && e.parameter._sessionNonce) || '';

  let email = ownerBypass
    ? rawEffective.trim().toLowerCase()
    : (rawActive || '').trim().toLowerCase();

  // nonce로 이메일 복원 (GSI 세션)
  if (!email && sessionNonce) {
    const cached = CacheService.getScriptCache().get('session_' + sessionNonce);
    if (cached) email = cached;
  }

  // _ownerBypass=1 일 때 nonce를 생성해 handleClientRequest에서도 email을 복원할 수 있게 함
  let effectiveNonce = sessionNonce;
  if (ownerBypass && email && !sessionNonce) {
    effectiveNonce = Utilities.getUuid();
    CacheService.getScriptCache().put('session_' + effectiveNonce, email, 21600);
  }

  Logger.log(
    `[doGet] rawActive="${rawActive}" rawEffective="${rawEffective}" ` +
    `resolved="${email}" ownerBypass=${ownerBypass} nonce="${effectiveNonce}"`
  );

  // 이메일 미확인 → GSI 로그인 페이지
  if (!email) {
    return HtmlService.createHtmlOutput(buildSignInPage_())
      .setTitle('MSO-ERP - 로그인')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  const profile = getUserProfile_(email);
  if (!profile) {
    return HtmlService.createHtmlOutput(buildAccessDeniedPage_(email))
      .setTitle('MSO-ERP - 접근 거부')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  if (profile.active === false || profile.active === 'FALSE') {
    return HtmlService.createHtmlOutput(
      '<h2 style="padding:40px;font-family:sans-serif">계정이 비활성화되었습니다. 관리자에게 문의하세요.</h2>'
    );
  }

  const page = (e && e.parameter.page) || 'schedule';

  const template = HtmlService.createTemplateFromFile('WebApp_Main');
  template.userEmail    = email;
  template.userRole     = profile.role;
  template.userName     = profile.display_name || email;
  template.hospitalId   = profile.hospital_id  || '';
  template.supplierId   = profile.supplier_id  || '';
  template.page         = page;
  template.sessionNonce = effectiveNonce; // 클라이언트가 __nonce로 handleClientRequest에 전달

  return template.evaluate()
    .setTitle('MSO-ERP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ─── include: HTML 파일 삽입 ──────────────────────────────────

function include_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ─── GSI 세션 초기화 ──────────────────────────────────────────

/**
 * Google Identity Services ID 토큰을 tokeninfo API로 검증하고
 * 서버 세션 nonce(6시간 유효)를 발급한다.
 * buildSignInPage_()의 onGsiCredential 콜백에서 호출.
 * @param {string} idToken - GSI callback의 response.credential (JWT)
 * @returns {string} JSON { nonce, email, registered } | { error }
 */
function initSession(idToken) {
  try {
    if (!idToken) return JSON.stringify({ error: 'ID 토큰이 없습니다' });

    const res = UrlFetchApp.fetch(
      'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
      { muteHttpExceptions: true }
    );
    const tokenInfo = JSON.parse(res.getContentText());

    if (tokenInfo.error || !tokenInfo.email) {
      Logger.log(`[initSession] 토큰 검증 실패: ${res.getContentText()}`);
      return JSON.stringify({ error: '토큰 검증 실패. 다시 시도하세요.' });
    }

    const email = tokenInfo.email.trim().toLowerCase();
    Logger.log(`[initSession] GSI 인증 성공: ${email}`);

    const nonce = Utilities.getUuid();
    CacheService.getScriptCache().put('session_' + nonce, email, 21600); // 6시간

    const profile = getUserProfile_(email);
    return JSON.stringify({
      nonce,
      email,
      registered: !!profile,
    });
  } catch (err) {
    Logger.log(`[initSession] 오류: ${err.message}`);
    return JSON.stringify({ error: err.message });
  }
}

// ─── ping: 연결 테스트 (인증 불필요) ─────────────────────────

/**
 * google.script.run 동작 여부 확인용. handleClientRequest 경유 없이 직접 호출.
 * 브라우저 콘솔에서: google.script.run.withSuccessHandler(console.log).ping()
 * @returns {string} JSON { pong, ts, email }
 */
function ping() {
  const activeEmail    = (Session.getActiveUser().getEmail()    || '').trim().toLowerCase();
  const effectiveEmail = (Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
  Logger.log(`[ping] activeUser="${activeEmail}" effectiveUser="${effectiveEmail}"`);
  return JSON.stringify({
    pong:      true,
    ts:        new Date().toISOString(),
    email:     activeEmail || '(empty)',
    effective: effectiveEmail,
  });
}

// ─── handleClientRequest: 클라이언트 API 엔드포인트 ──────────

/**
 * 클라이언트(WebApp_Main.html)에서 google.script.run.handleClientRequest() 로 호출.
 * GSI 세션 사용 시 data.__nonce 에 doGet에서 전달받은 sessionNonce를 포함해야 함.
 * @param {string} action
 * @param {Object} data
 * @returns {string} JSON 문자열
 */
function handleClientRequest(action, data) {
  Logger.log(`[handleClientRequest] START action="${action}"`);
  try {
    let email = (Session.getActiveUser().getEmail() || '').trim().toLowerCase();

    // GSI 세션: data.__nonce로 이메일 복원
    if (!email && data && data.__nonce) {
      const cached = CacheService.getScriptCache().get('session_' + data.__nonce);
      if (cached) {
        email = cached;
        Logger.log(`[handleClientRequest] GSI 세션 이메일 복원: ${email}`);
      }
    }

    Logger.log(`[handleClientRequest] action="${action}" email="${email}"`);

    if (!email) {
      return JSON.stringify({ error: '인증 정보가 없습니다. 다시 로그인하세요.', code: 401 });
    }

    const profile = getUserProfile_(email);

    if (!profile || profile.active === false || profile.active === 'FALSE') {
      return JSON.stringify({ error: '접근 권한이 없습니다', code: 403 });
    }

    const role = profile.role;

    if (!hasPermission_(role, action)) {
      return JSON.stringify({ error: `'${action}' 권한이 없습니다 (역할: ${role})`, code: 403 });
    }

    const result = dispatchAction_(action, data || {}, email, role, profile);
    return JSON.stringify(result);

  } catch (err) {
    Logger.log(`handleClientRequest 오류 [${action}]: ${err.stack}`);
    return JSON.stringify({ error: err.message, code: 500 });
  }
}

// ─── dispatchAction: 액션 → 함수 매핑 ───────────────────────

function dispatchAction_(action, data, user, role, profile) {
  const A = {
    // 진단
    'ping': () => ({ pong: true, ts: new Date().toISOString(), user, role }),

    // 사용자
    'user.profile':    () => apiGetCurrentProfile(data, user, role),
    'user.list':       () => apiGetUsers(data, user, role),
    'user.upsert':     () => apiUpsertUser(data, user, role),

    // 대시보드
    'dashboard.summary': () => getDashboardData(user, role, profile),

    // 리드
    'lead.list':   () => getLeads(data, user, role, profile),
    'lead.create': () => createLead(data, user, role),
    'lead.update': () => updateLead(data, user, role),
    'lead.delete': () => softDeleteLead_api(data, user, role),

    // 케이스
    'case.list':         () => getCases(data, user, role, profile),
    'case.get':          () => getCaseDetail(data.caseId, user, role, profile),
    'case.create':       () => createCase_api(data, user, role),
    'case.changeStatus':       () => updateCaseStatus(data.caseId, data.targetStatus, user, role),
    'case.scheduleTreatment':  () => scheduleTreatment_api(data, user, role),
    'case.delete':             () => softDeleteCase_api(data, user, role),

    // 환자
    'patient.get':    () => getPatient(data.patientId, user, role),
    'patient.create': () => createPatient(data, user, role),

    // 참조 데이터
    'hospital.list':    () => getHospitalList(),
    'supplier.list':    () => getSupplierList(),
    'coordinator.list': () => getCoordinatorList(user, role),

    // 병원 검토
    'review.request': () => requestReview_api(data, user, role),
    'review.get':     () => getReview(data.caseId),
    'review.submit':  () => submitHospitalReview(data, user, role),

    // 공급 주문
    'supplier.order.list':        () => getSupplierOrders(data, user, role, profile),
    'supplier.order.create':      () => createSupplierOrder_api(data, user, role),
    'supplier.shipment.confirm':  () => confirmShipment_api(data, user, role),
    'supplier.delivery.confirm':  () => confirmDelivery_api(data, user, role),
    'supplier.acceptance.record': () => recordAcceptanceCheck_api(data, user, role),

    // 결제
    'billing.list':          () => getBilling(data, user, role),
    'billing.save':          () => saveBilling(data, user, role),
    'billing.markAgreed':    () => markQuoteAgreed_api(data, user, role),
    'billing.issueQuote':    () => issueQuote_api(data, user, role),
    'billing.issueInvoice':  () => issueInvoice_api(data, user, role),
    'billing.recordPayment': () => recordPayment_api(data, user, role),

    // 추적관찰
    'followup.list':     () => getFollowups(data, user, role, profile),
    'followup.complete': () => completeFollowup_api(data, user, role),

    // 문서
    'document.register': () => registerDocument_api(data, user, role),
    'document.list':     () => getDocuments(data.caseId, user, role),

    // 시술 기록
    'procedure.list':   () => getProcedures_api(data, user, role, profile),
    'procedure.create': () => createProcedure_api(data, user, role),

    // 일정
    'appointment.list':   () => getAppointments(data, user, role),
    'appointment.create': () => createAppointment_api(data, user, role),
    'calendar.events':    () => getCalendarEvents(data, user, role, profile),
  };

  if (!A[action]) throw new Error(`알 수 없는 액션: ${action}`);
  return A[action]();
}

// ─── 페이지 빌더 ─────────────────────────────────────────────

/**
 * Execute-as-Me 환경에서 외부 도메인 사용자에게 보여주는 GSI 로그인 페이지.
 * CONFIG.GOOGLE_CLIENT_ID 설정 후 동작함.
 * 설정 방법: GCP Console → API 및 서비스 → 사용자 인증 정보 →
 *   OAuth 클라이언트 ID(웹 애플리케이션) 생성 → Apps Script URL을 승인된 출처에 추가
 */
function buildSignInPage_() {
  const clientId  = CONFIG.GOOGLE_CLIENT_ID || '';
  const scriptUrl = ScriptApp.getService().getUrl();

  return `<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><title>MSO-ERP 로그인</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <style>
      body{font-family:'Google Sans',sans-serif;display:flex;align-items:center;
        justify-content:center;min-height:100vh;margin:0;background:#f8f9fa}
      .box{text-align:center;padding:48px 40px;background:#fff;border-radius:12px;
        box-shadow:0 2px 8px rgba(0,0,0,.12);max-width:440px;width:100%}
      h2{color:#1a73e8;margin:0 0 8px;font-size:22px}
      p{color:#5f6368;font-size:14px;margin:0 0 28px}
      #g_signin_btn{display:flex;justify-content:center}
      #msg{color:#ea4335;font-size:13px;margin-top:16px;min-height:20px}
      .warn{background:#fef7e0;border:1px solid #fbbc04;border-radius:8px;
        padding:12px 14px;font-size:12px;color:#7a5000;margin-top:20px;text-align:left}
    </style></head><body>
    <div class="box">
      <h2>MSO-ERP</h2>
      <p>Google 계정으로 로그인하세요</p>
      ${clientId ? `
      <div id="g_id_onload"
        data-client_id="${clientId}"
        data-callback="onGsiCredential"
        data-auto_prompt="false">
      </div>
      <div id="g_signin_btn">
        <div class="g_id_signin"
          data-type="standard"
          data-shape="rectangular"
          data-theme="outline"
          data-text="signin_with"
          data-size="large"
          data-locale="ko">
        </div>
      </div>` : `
      <div class="warn">
        ⚠️ <strong>CONFIG.GOOGLE_CLIENT_ID</strong>가 설정되지 않았습니다.<br>
        00_Config.js에서 GCP OAuth 클라이언트 ID를 입력하고 재배포하세요.<br><br>
        임시 테스트: 배포 URL에 <code>?_ownerBypass=1</code> 추가
      </div>`}
      <div id="msg"></div>
    </div>
    <script>
      const SCRIPT_URL = '${scriptUrl}';
      function onGsiCredential(response) {
        document.getElementById('msg').textContent = '로그인 처리 중…';
        google.script.run
          .withSuccessHandler(function(raw) {
            const r = JSON.parse(raw);
            if (r.error) {
              document.getElementById('msg').textContent = '오류: ' + r.error;
              return;
            }
            if (!r.registered) {
              document.getElementById('msg').textContent =
                r.email + ' 계정은 등록되지 않았습니다. MSO 관리자에게 문의하세요.';
              return;
            }
            // nonce를 URL 파라미터로 전달 → doGet이 세션 복원
            window.top.location.href = SCRIPT_URL + '?_sessionNonce=' + encodeURIComponent(r.nonce);
          })
          .withFailureHandler(function(err) {
            document.getElementById('msg').textContent = '서버 오류: ' + err.message;
          })
          .initSession(response.credential);
      }
    </script>
    </body></html>`;
}

function buildAccessDeniedPage_(email) {
  return `<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><title>접근 거부</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;
        min-height:100vh;margin:0;background:#f8f9fa}
      .box{text-align:center;padding:40px;background:#fff;border-radius:12px;
        box-shadow:0 2px 8px rgba(0,0,0,.1);max-width:400px}
      h2{color:#ea4335;margin-bottom:12px}p{color:#5f6368;font-size:14px}
      code{background:#f1f3f4;padding:2px 6px;border-radius:4px}
    </style></head><body>
    <div class="box">
      <h2>접근 권한 없음</h2>
      <p>등록되지 않은 계정입니다.</p>
      <p><code>${email}</code></p>
      <p style="margin-top:16px">MSO 관리자에게 계정 등록을 요청하세요.</p>
    </div></body></html>`;
}
