// MSO ERP - 웹앱 진입점, 라우터, 공통 유틸
// 배포: Apps Script 편집기 → 배포 → 새 배포 → 웹앱
//       실행 계정: 나 / 액세스: 조직 내 모든 사용자

// ─── doGet: 모든 페이지 요청 진입점 ──────────────────────────

function doGet(e) {
  const email = Session.getActiveUser().getEmail();

  // 미등록 사용자 처리
  const profile = getUserProfile_(email);
  if (!profile) {
    return HtmlService.createHtmlOutput(buildAccessDeniedPage_(email))
      .setTitle('MSO-ERP - 접근 거부')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  // 비활성 계정 처리
  if (profile.active === false || profile.active === 'FALSE') {
    return HtmlService.createHtmlOutput('<h2 style="padding:40px;font-family:sans-serif">계정이 비활성화되었습니다. 관리자에게 문의하세요.</h2>');
  }

  const page = (e && e.parameter.page) || 'dashboard';

  const template = HtmlService.createTemplateFromFile('WebApp_Main');
  template.userEmail   = email;
  template.userRole    = profile.role;
  template.userName    = profile.display_name || email;
  template.hospitalId  = profile.hospital_id || '';
  template.supplierId  = profile.supplier_id || '';
  template.page        = page;

  return template.evaluate()
    .setTitle('MSO-ERP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ─── include: HTML 파일 삽입 ──────────────────────────────────

/**
 * HTML 템플릿 안에서 <?!= include_('filename'); ?> 로 사용
 */
function include_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ─── handleClientRequest: 클라이언트 API 엔드포인트 ──────────

/**
 * 클라이언트(WebApp_Main.html)에서 google.script.run.handleClientRequest() 로 호출
 * @param {string} action - 'case.get', 'lead.create' 등
 * @param {Object} data - 액션 파라미터
 * @returns {string} JSON 문자열
 */
function handleClientRequest(action, data) {
  try {
    const email = Session.getActiveUser().getEmail();
    const profile = getUserProfile_(email);

    if (!profile || profile.active === false || profile.active === 'FALSE') {
      return JSON.stringify({ error: '접근 권한이 없습니다', code: 403 });
    }

    const role = profile.role;

    // 권한 검사
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

    // 케이스
    'case.list':         () => getCases(data, user, role, profile),
    'case.get':          () => getCaseDetail(data.caseId, user, role, profile),
    'case.create':       () => createCase_api(data, user, role),
    'case.changeStatus': () => updateCaseStatus(data.caseId, data.targetStatus, user, role),

    // 환자
    'patient.get':    () => getPatient(data.patientId, user, role),
    'patient.create': () => createPatient(data, user, role),

    // 병원 검토
    'review.get':    () => getReview(data.caseId),
    'review.submit': () => submitHospitalReview(data, user, role),

    // 공급 주문
    'supplier.order.list':           () => getSupplierOrders(data, user, role, profile),
    'supplier.order.create':         () => createSupplierOrder_api(data, user, role),
    'supplier.shipment.confirm':     () => confirmShipment_api(data, user, role),
    'supplier.acceptance.record':    () => recordAcceptanceCheck_api(data, user, role),

    // 결제
    'billing.list':         () => getBilling(data, user, role),
    'billing.save':         () => saveBilling(data, user, role),
    'billing.issueQuote':   () => issueQuote_api(data, user, role),
    'billing.issueInvoice': () => issueInvoice_api(data, user, role),
    'billing.recordPayment':() => recordPayment_api(data, user, role),

    // 추적관찰
    'followup.list':     () => getFollowups(data, user, role, profile),
    'followup.complete': () => completeFollowup_api(data, user, role),

    // 문서
    'document.register': () => registerDocument_api(data, user, role),
    'document.list':     () => getDocuments(data.caseId, user, role),

    // 일정
    'appointment.list':   () => getAppointments(data, user, role),
    'appointment.create': () => createAppointment_api(data, user, role),
  };

  if (!A[action]) throw new Error(`알 수 없는 액션: ${action}`);
  return A[action]();
}

// ─── 접근 거부 페이지 ─────────────────────────────────────────

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
