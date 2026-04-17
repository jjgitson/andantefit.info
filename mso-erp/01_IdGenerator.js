// MSO ERP - ID 자동 생성 모듈

/**
 * 엔티티별 고유 ID 생성
 * 형식: PREFIX-YYYY-NNN (예: CASE-2026-001)
 * @param {string} sheetName - 대상 시트명
 * @param {string} prefix - ID 접두사
 * @param {string} idColumn - ID가 저장된 컬럼명 (기본값: 첫 번째 컬럼)
 * @returns {string} 생성된 ID
 */
function generateCustomId(sheetName, prefix, idColumn) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  const year = new Date().getFullYear();

  if (!sheet) throw new Error(`시트를 찾을 수 없습니다: ${sheetName}`);

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return `${prefix}-${year}-001`;

  const headers = data[0];
  const colIndex = idColumn
    ? headers.indexOf(idColumn)
    : 0;

  const yearPrefix = `${prefix}-${year}-`;
  let maxSeq = 0;

  for (let i = 1; i < data.length; i++) {
    const id = String(data[i][colIndex]);
    if (id.startsWith(yearPrefix)) {
      const seq = parseInt(id.replace(yearPrefix, ''), 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${yearPrefix}${nextSeq}`;
}

/**
 * 환자 코드 생성 (개인정보 대체 식별자)
 * 형식: P + 연도 2자리 + 랜덤 4자리 (예: P26A3F7)
 */
function generatePatientCode() {
  const year = String(new Date().getFullYear()).slice(-2);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `P${year}${rand}`;
}

/**
 * 감사 로그 ID 생성 (타임스탬프 기반, 충돌 방지)
 */
function generateAuditId() {
  return `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * 활동 로그 ID 생성
 */
function generateActivityId() {
  return `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
