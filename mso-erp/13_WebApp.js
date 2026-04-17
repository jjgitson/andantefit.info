// MSO ERP - 웹앱 진입점 및 라우터
// 배포: 확장 프로그램 → Apps Script → 배포 → 새 배포 → 웹앱

/**
 * HTTP GET 핸들러 - 모든 웹앱 요청의 진입점
 */
function doGet(e) {
  const page = e.parameter.page || 'dashboard';
  const user = Session.getActiveUser().getEmail();
  const role = getUserRole_(user);

  if (!role) {
    return HtmlService.createHtmlOutput('<h2>접근 권한이 없습니다. 관리자에게 문의하세요.</h2>');
  }

  const template = HtmlService.createTemplateFromFile('WebApp_Main');
  template.page = page;
  template.userEmail = user;
  template.userRole = role;
  template.userName = getUserName_(user);

  return template.evaluate()
    .setTitle('MSO-ERP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * HTTP POST 핸들러 - API 요청 처리
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const user = Session.getActiveUser().getEmail();
    const role = getUserRole_(user);

    if (!role) return jsonResponse_({ error: '권한 없음' }, 403);

    const result = dispatchAction_(action, payload.data, user, role);
    return jsonResponse_(result);
  } catch (err) {
    Logger.log(err.stack);
    return jsonResponse_({ error: err.message }, 500);
  }
}

/**
 * 액션 디스패처 - action 문자열로 적절한 함수 호출
 */
function dispatchAction_(action, data, user, role) {
  const ACTIONS = {
    // Leads
    'lead.list':        () => apiGetLeads(data, user, role),
    'lead.create':      () => apiCreateLead(data, user, role),
    'lead.update':      () => apiUpdateLead(data, user, role),

    // Cases
    'case.list':        () => apiGetCases(data, user, role),
    'case.get':         () => apiGetCase(data.caseId, user, role),
    'case.create':      () => apiCreateCase(data, user, role),
    'case.changeStatus':() => apiChangeCaseStatus(data, user, role),

    // Hospital Review
    'review.submit':    () => apiSubmitHospitalReview(data, user, role),
    'review.get':       () => apiGetReview(data.caseId, user, role),

    // Supplier Orders
    'supplier.order.create':  () => apiCreateSupplierOrder(data, user, role),
    'supplier.order.list':    () => apiGetSupplierOrders(data, user, role),
    'supplier.shipment.confirm': () => apiConfirmShipment(data, user, role),
    'supplier.acceptance.record': () => apiRecordAcceptance(data, user, role),

    // Billing
    'billing.list':     () => apiGetBilling(data, user, role),
    'billing.create':   () => apiCreateBilling(data, user, role),
    'billing.issueQuote':   () => apiIssueQuote(data, user, role),
    'billing.issueInvoice': () => apiIssueInvoice(data, user, role),
    'billing.recordPayment':() => apiRecordPayment(data, user, role),

    // Followups
    'followup.list':    () => apiGetFollowups(data, user, role),
    'followup.complete':() => apiCompleteFollowup(data, user, role),

    // Documents
    'document.register':() => apiRegisterDocument(data, user, role),
    'document.list':    () => apiGetDocuments(data.caseId, user, role),

    // Dashboard
    'dashboard.summary':() => apiGetDashboardSummary(user, role),

    // Appointments
    'appointment.list': () => apiGetAppointments(data, user, role),
    'appointment.create':() => apiCreateAppointment(data, user, role),
  };

  if (!ACTIONS[action]) throw new Error(`알 수 없는 액션: ${action}`);
  return ACTIONS[action]();
}

// ─── 사용자 역할 관리 ─────────────────────────────────────────

/**
 * 사용자 이메일로 역할 조회
 * Users 시트 또는 Script Properties 사용
 */
function getUserRole_(email) {
  const props = PropertiesService.getScriptProperties();
  const usersJson = props.getProperty('USERS');

  if (usersJson) {
    const users = JSON.parse(usersJson);
    return users[email] || null;
  }

  // Fallback: 스프레드시트 Users 시트 조회 (선택적)
  return null;
}

function getUserName_(email) {
  const props = PropertiesService.getScriptProperties();
  const namesJson = props.getProperty('USER_NAMES');
  if (namesJson) {
    const names = JSON.parse(namesJson);
    return names[email] || email;
  }
  return email;
}

/**
 * 사용자 등록 (Admin이 Script Properties에 저장)
 * 실행 방법: Apps Script 편집기에서 직접 호출
 */
function addUser(email, role, name) {
  const props = PropertiesService.getScriptProperties();

  // 역할 등록
  const usersJson = props.getProperty('USERS') || '{}';
  const users = JSON.parse(usersJson);
  users[email] = role;
  props.setProperty('USERS', JSON.stringify(users));

  // 이름 등록
  const namesJson = props.getProperty('USER_NAMES') || '{}';
  const names = JSON.parse(namesJson);
  names[email] = name;
  props.setProperty('USER_NAMES', JSON.stringify(names));

  Logger.log(`사용자 등록: ${email} / ${role} / ${name}`);
}

/**
 * 현재 등록된 사용자 목록 확인
 */
function listUsers() {
  const props = PropertiesService.getScriptProperties();
  const users = JSON.parse(props.getProperty('USERS') || '{}');
  Logger.log(JSON.stringify(users, null, 2));
}

// ─── 역할별 데이터 접근 제어 ──────────────────────────────────

/**
 * 케이스 목록 필터링 (역할 기반)
 */
function filterCasesByRole_(cases, user, role) {
  switch (role) {
    case 'MSO Admin':
      return cases;
    case 'MSO Coordinator':
      return cases.filter(c => c.assigned_coordinator === user);
    case 'Hospital User':
      const hospitalId = getUserHospitalId_(user);
      return cases.filter(c => c.hospital_id === hospitalId);
    case 'Supplier User':
      return []; // Supplier는 Cases 직접 접근 안 함 (Orders로 접근)
    case 'Finance User':
      return cases; // Billing 목적으로 전체 조회 허용
    default:
      return [];
  }
}

function getUserHospitalId_(email) {
  const props = PropertiesService.getScriptProperties();
  const mappingJson = props.getProperty('USER_HOSPITAL_MAP') || '{}';
  return JSON.parse(mappingJson)[email] || null;
}

function getUserSupplierId_(email) {
  const props = PropertiesService.getScriptProperties();
  const mappingJson = props.getProperty('USER_SUPPLIER_MAP') || '{}';
  return JSON.parse(mappingJson)[email] || null;
}

// ─── 유틸리티 ─────────────────────────────────────────────────

function jsonResponse_(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function include_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * 클라이언트에서 google.script.run으로 호출하는 API 엔드포인트
 * WebApp_Main.html의 callServer() 함수에서 호출됨
 */
function handleClientRequest(action, data) {
  const user = Session.getActiveUser().getEmail();
  const role = getUserRole_(user);
  if (!role) throw new Error('접근 권한이 없습니다');
  const result = dispatchAction_(action, data, user, role);
  return JSON.stringify(result);
}
