// MSO ERP - 감사 추적 및 활동 로그 모듈

// ─── Audit Log ───────────────────────────────────────────────

/**
 * 필드 변경 내역을 Audit_Log에 기록
 * @param {string} entityName - 테이블명
 * @param {string} entityId - 레코드 ID
 * @param {string} fieldName - 변경된 필드명
 * @param {*} oldValue
 * @param {*} newValue
 * @param {string} editedBy - 변경자 이메일
 * @param {string} changeSource - 'AppSheet' | 'Apps Script' | 'Manual Sheet Edit'
 */
function createAuditLog(entityName, entityId, fieldName, oldValue, newValue, editedBy, changeSource) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.AUDIT_LOG);

  sheet.appendRow([
    generateAuditId(),
    entityName,
    entityId,
    fieldName,
    oldValue !== undefined && oldValue !== null ? String(oldValue) : '',
    newValue !== undefined && newValue !== null ? String(newValue) : '',
    editedBy || Session.getActiveUser().getEmail(),
    new Date(),
    changeSource || 'Apps Script',
  ]);
}

/**
 * 특정 엔티티의 변경 이력 조회
 * @param {string} entityName
 * @param {string} entityId
 * @returns {Array} 변경 이력 배열
 */
function getAuditHistory(entityName, entityId) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.AUDIT_LOG);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const colEntity = headers.indexOf('entity_name');
  const colId = headers.indexOf('entity_id');

  return data.slice(1).filter(row =>
    row[colEntity] === entityName && row[colId] === entityId
  ).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

// ─── Activity Log ─────────────────────────────────────────────

/**
 * 활동 로그 추가
 * @param {Object} params
 * @param {string} params.caseId
 * @param {string} params.actorEmail
 * @param {string} params.actorRole
 * @param {string} params.actorName
 * @param {string} params.actionType
 * @param {string} params.summary
 * @param {string} [params.nextAction]
 * @param {Date}   [params.nextActionDate]
 */
function addActivityLog(params) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVITY_LOG);

  sheet.appendRow([
    generateActivityId(),
    params.caseId || '',
    new Date(),
    params.actorRole || '',
    params.actorName || '',
    params.actorEmail || Session.getActiveUser().getEmail(),
    params.actionType || '',
    params.summary || '',
    params.nextAction || '',
    params.nextActionDate || '',
  ]);
}

// ─── 중요 테이블 onEdit 감사 추적 ──────────────────────────────

/**
 * 스프레드시트 onEdit 트리거에서 호출
 * 감사 대상 시트의 변경을 자동으로 Audit_Log에 기록
 */
function onEditAuditHandler(e) {
  const AUDITED_SHEETS = [
    CONFIG.SHEETS.PATIENTS,
    CONFIG.SHEETS.CASES,
    CONFIG.SHEETS.MEDICAL_REVIEW,
    CONFIG.SHEETS.SUPPLIER_ORDERS,
    CONFIG.SHEETS.BILLING,
    CONFIG.SHEETS.DOCUMENTS,
  ];

  if (!e || !e.range) return;

  const sheetName = e.range.getSheet().getName();
  if (!AUDITED_SHEETS.includes(sheetName)) return;

  const sheet = e.range.getSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = e.range.getRow();
  const col = e.range.getColumn();

  if (row === 1) return; // 헤더 수정은 무시

  const idColIndex = 0; // 첫 번째 컬럼이 ID
  const entityId = sheet.getRange(row, idColIndex + 1).getValue();
  const fieldName = headers[col - 1];
  const newValue = e.value;
  const oldValue = e.oldValue;

  if (String(oldValue) === String(newValue)) return;

  createAuditLog(
    sheetName,
    entityId,
    fieldName,
    oldValue,
    newValue,
    Session.getActiveUser().getEmail(),
    'Manual Sheet Edit'
  );
}
