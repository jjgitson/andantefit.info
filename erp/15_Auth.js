// MSO ERP - 사용자 인증 및 권한 관리 모듈
// Users 시트를 단일 진실 공급원으로 사용
// active 컬럼: Boolean (TRUE/FALSE) — 문자열 'TRUE' 사용 금지

// ─── 역할 상수 ────────────────────────────────────────────────────

const ROLES = {
  MSO_ADMIN:       'MSO Admin',
  MSO_COORDINATOR: 'MSO Coordinator',
  HOSPITAL_USER:   'Hospital User',
  SUPPLIER_USER:   'Supplier User',
  FINANCE_USER:    'Finance User',
};

// ─── 역할별 허용 액션 화이트리스트 ───────────────────────────────

const ROLE_PERMISSIONS = {
  'MSO Admin': ['*'],

  'MSO Coordinator': [
    'ping',
    'dashboard.summary', 'calendar.events',
    'lead.list', 'lead.create', 'lead.update',
    'case.list', 'case.get', 'case.create', 'case.changeStatus',
    'patient.get', 'patient.create',
    'review.get',
    'supplier.order.create', 'supplier.order.list',
    'supplier.shipment.confirm', 'supplier.delivery.confirm',
    'billing.list', 'billing.save',
    'followup.list', 'followup.complete',
    'document.register', 'document.list',
    'appointment.list', 'appointment.create',
  ],

  'Hospital User': [
    'ping',
    'dashboard.summary', 'calendar.events',
    'case.list', 'case.get',
    'review.submit', 'review.get',
    'supplier.order.list', 'supplier.acceptance.record',
    'document.list',
    'appointment.list', 'appointment.create',
  ],

  'Supplier User': [
    'ping',
    'dashboard.summary', 'calendar.events',
    'supplier.order.list', 'supplier.shipment.confirm',
    'document.list', 'document.register',
  ],

  'Finance User': [
    'ping',
    'dashboard.summary', 'calendar.events',
    'case.list', 'case.get',
    'billing.list', 'billing.save',
    'billing.issueQuote', 'billing.issueInvoice', 'billing.recordPayment',
  ],
};

// ─── 사용자 프로필 조회 ────────────────────────────────────────────

function getCurrentUserProfile() {
  return getUserProfile_(Session.getActiveUser().getEmail());
}

/**
 * 이메일로 Users 시트에서 프로필 조회
 * active 컬럼이 false(Boolean) 또는 빈 값인 경우 null 반환
 */
function getUserProfile_(email) {
  if (!email) return null;
  const normalizedEmail = email.trim().toLowerCase();
  Logger.log(`[getUserProfile_] 조회: "${normalizedEmail}"`);

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colEmail  = headers.indexOf('user_email');
  const colActive = headers.indexOf('active');

  for (let i = 1; i < data.length; i++) {
    const rowEmail = (data[i][colEmail] || '').toString().trim().toLowerCase();
    if (rowEmail !== normalizedEmail) continue;
    const activeVal = data[i][colActive];
    if (activeVal === false || activeVal === '' || activeVal === 'FALSE') {
      Logger.log(`[getUserProfile_] 비활성 계정: "${normalizedEmail}"`);
      continue;
    }
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = data[i][idx]; });
    Logger.log(`[getUserProfile_] 프로필 발견: role="${obj.role}"`);
    return obj;
  }
  Logger.log(`[getUserProfile_] 미등록: "${normalizedEmail}"`);
  return null;
}

function getUserRole_(email) {
  const profile = getUserProfile_(email);
  return profile ? profile.role : null;
}

// ─── 권한 검증 ────────────────────────────────────────────────────

function hasPermission_(role, action) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.includes('*')) return true;
  return perms.includes(action);
}

// ─── 케이스 역할별 필터링 ─────────────────────────────────────────

function filterCasesByRole_(cases, user, role, profile) {
  profile = profile || getUserProfile_(user);
  if (!profile) return [];

  switch (role) {
    case ROLES.MSO_ADMIN:
      return cases;

    case ROLES.MSO_COORDINATOR:
      if (profile.allowed_case_scope === 'all') return cases;
      return cases.filter(c => c.assigned_coordinator === user);

    case ROLES.HOSPITAL_USER:
      return cases.filter(c => c.hospital_id === profile.hospital_id);

    case ROLES.SUPPLIER_USER:
      return []; // Supplier는 Supplier_Orders로만 접근

    case ROLES.FINANCE_USER:
      return cases;

    default:
      return [];
  }
}

function canHospitalAccessCase_(profile, caseData) {
  return !!(profile.hospital_id && caseData.hospital_id === profile.hospital_id);
}

function canSupplierAccessOrder_(profile, order) {
  return !!(profile.supplier_id && order.supplier_id === profile.supplier_id);
}

// ─── Users 시트 관리 ──────────────────────────────────────────────

/**
 * 역할별 필수 컬럼 유효성 검사
 * Hospital User  → hospital_id 필수
 * Supplier User  → supplier_id 필수
 * MSO Admin/Coordinator/Finance → 둘 다 불필요
 */
function validateUserParams_(params) {
  if (!params.user_email) throw new Error('user_email 필수');
  if (!params.role || !Object.values(ROLES).includes(params.role))
    throw new Error(`role 값 오류. 허용: ${Object.values(ROLES).join(', ')}`);

  if (params.role === ROLES.HOSPITAL_USER && !params.hospital_id)
    throw new Error('Hospital User는 hospital_id 필수');
  if (params.role === ROLES.SUPPLIER_USER && !params.supplier_id)
    throw new Error('Supplier User는 supplier_id 필수');
}

/**
 * 사용자 등록/수정 (Admin 전용)
 * active는 Boolean으로 저장 (true/false)
 */
function upsertUser(params) {
  validateUserParams_(params);

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  if (!sheet) throw new Error('Users 시트가 없습니다. setupAllSheets()를 먼저 실행하세요.');

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colEmail = headers.indexOf('user_email');

  for (let i = 1; i < data.length; i++) {
    if (data[i][colEmail] !== params.user_email) continue;
    const updatable = ['role', 'display_name', 'hospital_id', 'supplier_id', 'active', 'allowed_case_scope'];
    updatable.forEach(field => {
      if (params[field] !== undefined) {
        sheet.getRange(i + 1, headers.indexOf(field) + 1).setValue(
          field === 'active' ? !!params[field] : params[field]  // Boolean 강제
        );
      }
    });
    Logger.log(`사용자 업데이트: ${params.user_email}`);
    return { action: 'updated', email: params.user_email };
  }

  // 신규 추가
  sheet.appendRow([
    params.user_email,
    params.role,
    params.display_name || '',
    params.hospital_id  || '',
    params.supplier_id  || '',
    params.active !== undefined ? !!params.active : true,  // Boolean
    params.allowed_case_scope || (params.role === ROLES.MSO_ADMIN ? 'all' : 'own'),
    new Date(),
  ]);
  Logger.log(`사용자 등록: ${params.user_email}`);
  return { action: 'created', email: params.user_email };
}

function deactivateUser(email) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colEmail  = headers.indexOf('user_email');
  const colActive = headers.indexOf('active');

  for (let i = 1; i < data.length; i++) {
    if (data[i][colEmail] !== email) continue;
    sheet.getRange(i + 1, colActive + 1).setValue(false);  // Boolean false
    Logger.log(`사용자 비활성화: ${email}`);
    return { action: 'deactivated', email };
  }
  throw new Error(`사용자를 찾을 수 없습니다: ${email}`);
}

// ─── API 래퍼 ────────────────────────────────────────────────────

function apiGetUsers(data, user, role) {
  if (role !== ROLES.MSO_ADMIN) throw new Error('Admin 권한 필요');
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  return { users: sheetToObjects_(ss, CONFIG.SHEETS.USERS) };
}

function apiUpsertUser(data, user, role) {
  if (role !== ROLES.MSO_ADMIN) throw new Error('Admin 권한 필요');
  return upsertUser(data);
}

function apiGetCurrentProfile(data, user, role) {
  const profile = getUserProfile_(user);
  return { profile: profile || { user_email: user, role, display_name: user } };
}

// ─── 초기 Admin 등록 ─────────────────────────────────────────────

/**
 * 최초 Admin 등록
 *
 * 실행 방법 A — 스프레드시트 커스텀 메뉴 (권장):
 *   스프레드시트 열기 → 메뉴 [MSO-ERP] → [Admin 등록]
 *   → UI 팝업에서 이메일/이름 입력
 *
 * 실행 방법 B — Apps Script 편집기:
 *   함수 드롭다운에서 bootstrapAdmin 선택 후 ▶ 실행
 *   → 현재 로그인된 Google 계정이 자동으로 Admin으로 등록됨
 *   → 실행 로그에서 결과 확인
 */
function bootstrapAdmin() {
  let email, displayName;

  try {
    // 방법 A: 스프레드시트 UI에서 실행 (팝업 입력)
    const ui = SpreadsheetApp.getUi();

    const r1 = ui.prompt(
      'MSO-ERP Admin 등록',
      '관리자 이메일을 입력하세요.\n(비워두면 현재 로그인 계정 자동 사용)',
      ui.ButtonSet.OK_CANCEL
    );
    if (r1.getSelectedButton() !== ui.Button.OK) return;
    email = r1.getResponseText().trim() || Session.getActiveUser().getEmail();

    const r2 = ui.prompt(
      'MSO-ERP Admin 등록',
      '화면에 표시될 이름을 입력하세요.',
      ui.ButtonSet.OK_CANCEL
    );
    if (r2.getSelectedButton() !== ui.Button.OK) return;
    displayName = r2.getResponseText().trim() || email.split('@')[0];

  } catch (e) {
    // 방법 B: 편집기에서 실행 → 현재 계정 자동 사용
    email = Session.getActiveUser().getEmail();
    displayName = email.split('@')[0];
    Logger.log(`[bootstrapAdmin] UI 없음 → 현재 계정 자동 사용: ${email}`);
  }

  if (!email) {
    Logger.log('[bootstrapAdmin] 오류: 이메일을 확인할 수 없습니다. Google 계정으로 로그인 후 재시도하세요.');
    return;
  }

  upsertUser({
    user_email:          email,
    role:                ROLES.MSO_ADMIN,
    display_name:        displayName,
    active:              true,
    allowed_case_scope:  'all',
  });

  const msg = `Admin 등록 완료\n이메일: ${email}\n이름: ${displayName}`;
  Logger.log(`[bootstrapAdmin] ${msg}`);
  try { SpreadsheetApp.getUi().alert(msg); } catch(e) {}
}

/**
 * 샘플 사용자 일괄 등록 (개발/테스트용)
 * 실제 운영 전 삭제하거나 이메일 주소를 실제 값으로 교체할 것
 */
function seedSampleUsers() {
  const samples = [
    { user_email: 'coord1@mso.com',       role: ROLES.MSO_COORDINATOR, display_name: '코디1',   allowed_case_scope: 'own' },
    { user_email: 'doctor@hospital.com',  role: ROLES.HOSPITAL_USER,   display_name: '담당의사', hospital_id: 'HOSP-001' },
    { user_email: 'supply@supplier.com',  role: ROLES.SUPPLIER_USER,   display_name: '공급담당', supplier_id: 'SUPP-001' },
    { user_email: 'finance@mso.com',      role: ROLES.FINANCE_USER,    display_name: '재무담당', allowed_case_scope: 'all' },
  ];
  samples.forEach(u => upsertUser({ ...u, active: true }));
  Logger.log('샘플 사용자 등록 완료');
}
