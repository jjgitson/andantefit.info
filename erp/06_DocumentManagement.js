// MSO ERP - 문서 버전 관리 모듈

/**
 * 문서 등록 (버전 관리 포함)
 * 같은 case_id + document_type의 기존 최신 문서는 is_latest = No 처리
 * @param {Object} params
 * @param {string} params.caseId
 * @param {string} params.patientId
 * @param {string} params.documentType
 * @param {string} params.fileName
 * @param {string} params.driveLink
 * @param {string} params.uploadedBy
 * @param {string} [params.expiryDate]
 * @param {string} [params.notes]
 * @returns {string} 생성된 document_id
 */
function registerDocument(params) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.DOCUMENTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const colDocId = headers.indexOf('document_id');
  const colCaseId = headers.indexOf('case_id');
  const colDocType = headers.indexOf('document_type');
  const colIsLatest = headers.indexOf('is_latest');
  const colVersion = headers.indexOf('version_no');

  let maxVersion = 0;
  let replacesDocId = '';

  // 같은 케이스+타입의 기존 최신본 탐색 및 무효화
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (
      row[colCaseId] === params.caseId &&
      row[colDocType] === params.documentType &&
      row[colIsLatest] === 'Yes'
    ) {
      sheet.getRange(i + 1, colIsLatest + 1).setValue('No');
      replacesDocId = row[colDocId];

      const ver = parseInt(row[colVersion], 10);
      if (!isNaN(ver) && ver > maxVersion) maxVersion = ver;

      createAuditLog(
        'Documents', row[colDocId], 'is_latest',
        'Yes', 'No',
        params.uploadedBy, 'Apps Script'
      );
    }
  }

  const newVersion = maxVersion + 1;
  const documentId = generateCustomId(CONFIG.SHEETS.DOCUMENTS, 'DOC', 'document_id');

  sheet.appendRow([
    documentId,
    params.caseId || '',
    params.patientId || '',
    params.documentType || '',
    params.fileName || '',
    newVersion,
    'Yes',
    replacesDocId,
    params.uploadedBy || Session.getActiveUser().getEmail(),
    new Date(),
    params.driveLink || '',
    'Pending',
    params.expiryDate || '',
    params.notes || '',
  ]);

  addActivityLog({
    caseId: params.caseId,
    actorEmail: params.uploadedBy,
    actorRole: 'System',
    actionType: 'DOCUMENT_UPLOADED',
    summary: `문서 업로드: ${params.documentType} v${newVersion} (${params.fileName})`,
  });

  return documentId;
}

/**
 * 케이스의 최신 문서 목록 조회
 * @param {string} caseId
 * @returns {Array<Object>}
 */
function getLatestDocuments(caseId) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.DOCUMENTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  return data.slice(1)
    .filter(row =>
      row[headers.indexOf('case_id')] === caseId &&
      row[headers.indexOf('is_latest')] === 'Yes'
    )
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
}

/**
 * 특정 문서 타입의 버전 이력 조회
 * @param {string} caseId
 * @param {string} documentType
 * @returns {Array<Object>}
 */
function getDocumentVersionHistory(caseId, documentType) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.DOCUMENTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  return data.slice(1)
    .filter(row =>
      row[headers.indexOf('case_id')] === caseId &&
      row[headers.indexOf('document_type')] === documentType
    )
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    })
    .sort((a, b) => b.version_no - a.version_no);
}

/**
 * 만료 임박 문서 조회 (30일 이내)
 * @returns {Array<Object>}
 */
function getExpiringDocuments() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.DOCUMENTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const today = new Date();
  const threshold = addDays_(today, 30);

  return data.slice(1)
    .filter(row => {
      const expiry = row[headers.indexOf('expiry_date')];
      const isLatest = row[headers.indexOf('is_latest')];
      if (!expiry || isLatest !== 'Yes') return false;
      const expiryDate = new Date(expiry);
      return expiryDate >= today && expiryDate <= threshold;
    })
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
}
