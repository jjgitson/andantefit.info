// MSO ERP - 사용자 인증 및 권한 관리 모듈
// Users 시트를 단일 진실 공급원으로 사용

// ─── 상수 ─────────────────────────────────────────────────────

const ROLES = {
  MSO_ADMIN: 'MSO Admin',
  MSO_COORDINATOR: 'MSO Coordinator',
  HOSPITAL_USER: 'Hospital User',
  SUPPLIER_USER: 'Supplier User',
  FINANCE_USER: 'Finance User',
};

// 역할별 허용 액션 화이트리스트
const ROLE_PERMISSIONS = {
  'MSO Admin': ['*'], // 전체 허용
  'MSO Coordinator': [
    'dashboard.summary', 'lead.list', 'lead.create', 'lead.update',
    'case.list', 'case.get', 'case.create', 'case.changeStatus',
    'supplier.order.create', 'supplier.order.list',
    'followup.list', 'followup.complete',
    'document.register', 'document.list',
    'appointment.list', 'appointment.create',
    'review.get', 'patient.get',
  ],
  'Hospital User': [
    'dashboard.summary', 'case.list', 'case.get',
    'review.submit', 'review.get',
    'supplier.order.list', 'supplier.acceptance.record',
    'document.list', 'appointment.list', 'appointment.create',
  ],
  'Supplier User': [
    'dashboard.summary',
    'supplier.order.list', 'supplier.shipment.confirm',
    'document.list', 'document.register',
  ],
  'Finance User': [
    'dashboard.summary', 'case.list', 'case.get',
    'billing.list', 'billing.create',
    'billing.issueQuote', 'billing.issueInvoice', 'billing.recordPayment',
  ],
};

// ─── 사용자 프로필 조회 ────────────────────────────────────────

/**
 * 현재 로그인 사용자 프로필 반환
 * @returns {Object|null}
 */
function getCurrentUserProfile() {
  const email = Session.getActiveUser().getEmail();
  return getUserProfile_(email);
}

/**
 * 이메일로 사용자 프로필 조회
 * @param {string} email
 * @returns {Object|null} { email, role, display_name, hospital_id, supplier_id, active, allowed_case_scope }
 */
function getUserProfile_(email) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('user_email')] === email &&
        data[i][headers.indexOf('active')] !== 'FALSE') {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = data[i][idx]; });
      return obj;
    }
  }
  return null;
}

/**
 * 역할 문자열 반환 (하위 호환)
 */
function getUserRole_(email) {
  const profile = getUserProfile_(email);
  return profile ? profile.role : null;
}

// ─── 권한 검증 ────────────────────────────────────────────────

/**
 * 특정 액션에 대한 권한 확인
 * @param {string} role
 * @param {string} action
 * @returns {boolean}
 */
function hasPermission_(role, action) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.includes('*')) return true;
  return perms.includes(action);
}

/**
 * 역할별 케이스 목록 필터링
 * @param {Array} cases
 * @param {Object} profile - getUserProfile_ 결과
 * @returns {Array}
 */
function filterCasesByRole_(cases, user, role, profile) {
  profile = profile || getUserProfile_(user);
  if (!profile) return [];

  switch (role) {
    case ROLES.MSO_ADMIN:
      return cases;

    case ROLES.MSO_COORDINATOR:
      // allowed_case_scope: 'own' = 담당 케이스만, 'all' = 전체
      if (profile.allowed_case_scope === 'all') return cases;
      return cases.filter(c => c.assigned_coordinator === user);

    case ROLES.HOSPITAL_USER:
      return cases.filter(c => c.hospital_id === profile.hospital_id);

    case ROLES.SUPPLIER_USER:
      return []; // Supplier는 Orders로 접근

    case ROLES.FINANCE_USER:
      return cases;

    default:
      return [];
  }
}

/**
 * Hospital User가 특정 케이스에 접근 가능한지 확인
 */
function canHospitalAccessCase_(profile, caseData) {
  return profile.hospital_id && caseData.hospital_id === profile.hospital_id;
}

/**
 * Supplier User가 특정 주문에 접근 가능한지 확인
 */
function canSupplierAccessOrder_(profile, order) {
  return profile.supplier_id && order.supplier_id === profile.supplier_id;
}

// ─── Users 시트 관리 ──────────────────────────────────────────

/**
 * 사용자 등록/수정 (Admin 전용)
 * Apps Script 편집기에서 직접 실행하거나 웹앱 Admin 화면에서 호출
 */
function upsertUser(params) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  if (!sheet) throw new Error('Users 시트가 없습니다. setupAllSheets()를 먼저 실행하세요.');

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colEmail = headers.indexOf('user_email');

  // 기존 사용자 업데이트
  for (let i = 1; i < data.length; i++) {
    if (data[i][colEmail] === params.user_email) {
      const updatable = ['role','display_name','hospital_id','supplier_id','active','allowed_case_scope'];
      updatable.forEach(field => {
        if (params[field] !== undefined) {
          sheet.getRange(i + 1, headers.indexOf(field) + 1).setValue(params[field]);
        }
      });
      Logger.log(`사용자 업데이트: ${params.user_email}`);
      return { action: 'updated', email: params.user_email };
    }
  }

  // 신규 사용자 추가
  sheet.appendRow([
    params.user_email,
    params.role || ROLES.MSO_COORDINATOR,
    params.display_name || '',
    params.hospital_id || '',
    params.supplier_id || '',
    params.active !== undefined ? params.active : 'TRUE',
    params.allowed_case_scope || 'own',
    new Date(),
  ]);
  Logger.log(`사용자 등록: ${params.user_email}`);
  return { action: 'created', email: params.user_email };
}

/**
 * 사용자 비활성화
 */
function deactivateUser(email) {
  return upsertUser({ user_email: email, active: 'FALSE' });
}

/**
 * 전체 사용자 목록 조회 (Admin 전용)
 */
function apiGetUsers(data, user, role) {
  if (role !== ROLES.MSO_ADMIN) throw new Error('Admin 권한 필요');
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  return { users: sheetToObjects_(ss, 'Users') };
}

/**
 * 사용자 등록 (웹앱 Admin 화면에서 호출)
 */
function apiUpsertUser(data, user, role) {
  if (role !== ROLES.MSO_ADMIN) throw new Error('Admin 권한 필요');
  return upsertUser(data);
}

/**
 * 현재 사용자 프로필 API
 */
function apiGetCurrentProfile(data, user, role) {
  const profile = getUserProfile_(user);
  return { profile: profile || { user_email: user, role, display_name: user } };
}

// ─── 초기 Admin 설정 헬퍼 ────────────────────────────────────

/**
 * 최초 Admin 등록 (Apps Script 편집기에서 직접 실행)
 * 예: bootstrapAdmin('admin@company.com', '김관리자')
 */
function bootstrapAdmin(email, name) {
  upsertUser({
    user_email: email,
    role: ROLES.MSO_ADMIN,
    display_name: name,
    active: 'TRUE',
    allowed_case_scope: 'all',
  });
  Logger.log(`Admin 등록 완료: ${email}`);
  SpreadsheetApp.getUi().alert(`Admin 등록 완료: ${email}`);
}

/**
 * 샘플 사용자 일괄 등록 (테스트용)
 */
function seedSampleUsers() {
  const samples = [
    { user_email: 'admin@mso.com', role: 'MSO Admin', display_name: '관리자', allowed_case_scope: 'all' },
    { user_email: 'coord1@mso.com', role: 'MSO Coordinator', display_name: '코디1', allowed_case_scope: 'own' },
    { user_email: 'doctor@hospital.com', role: 'Hospital User', display_name: '담당의사', hospital_id: 'HOSP-001' },
    { user_email: 'supply@supplier.com', role: 'Supplier User', display_name: '공급담당', supplier_id: 'SUPP-001' },
    { user_email: 'finance@mso.com', role: 'Finance User', display_name: '재무담당', allowed_case_scope: 'all' },
  ];
  samples.forEach(u => upsertUser({ ...u, active: 'TRUE' }));
  Logger.log('샘플 사용자 등록 완료');
}
