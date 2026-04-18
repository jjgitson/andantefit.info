// MSO ERP - 케이스 관리 모듈

/**
 * 신규 케이스 생성
 * @param {Object} params
 * @param {string} params.patientId
 * @param {string} params.leadId
 * @param {string} params.hospitalId
 * @param {string} params.supplierId
 * @param {string} params.targetIndication
 * @param {string} params.assignedCoordinator
 * @param {string} params.priority
 * @param {string} params.remarks
 * @returns {string} 생성된 case_id
 */
function createCase(params) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.CASES);

  const caseId = generateCustomId(CONFIG.SHEETS.CASES, 'CASE', 'case_id');
  const now = new Date();

  const patientCode = getPatientCode_(params.patientId);

  sheet.appendRow([
    caseId,
    params.patientId || '',
    params.leadId || '',
    params.hospitalId || '',
    params.supplierId || '',
    CONFIG.CASE_STATUS.DRAFT,
    params.targetIndication || '',
    params.assignedCoordinator || Session.getActiveUser().getEmail(),
    '', // hospital_review_requested_at
    '', // hospital_decision_at
    '', // treatment_date
    '', // followup_due_date
    params.priority || 'Normal',
    params.remarks || '',
    '', // drive_folder_id
    '', // drive_folder_url
    now, // case_opened_at
    '', // case_closed_at
  ]);

  // Drive 폴더 생성
  const folderInfo = createCaseDriveFolder_(caseId, patientCode);
  if (folderInfo) {
    updateCaseField_(caseId, 'drive_folder_id', folderInfo.id);
    updateCaseField_(caseId, 'drive_folder_url', folderInfo.url);
  }

  // MSO Master Calendar 이벤트
  createCalendarEvent(
    CONFIG.CALENDAR_TYPES.MSO_MASTER,
    `[오픈] ${caseId} - ${patientCode}`,
    now,
    `케이스 ID: ${caseId}\n환자 코드: ${patientCode}\n병원: ${params.hospitalId || ''}\n담당자: ${params.assignedCoordinator || ''}`
  );

  // Activity Log
  addActivityLog({
    caseId,
    actionType: 'CASE_CREATED',
    summary: `케이스 생성: ${caseId} (환자: ${patientCode})`,
    nextAction: '병원 검토 요청',
  });

  Logger.log(`케이스 생성 완료: ${caseId}`);
  return caseId;
}

/**
 * 리드를 케이스로 전환
 * @param {string} leadId
 * @param {Object} caseParams - createCase 파라미터
 * @returns {string} case_id
 */
function convertLeadToCase(leadId, caseParams) {
  caseParams.leadId = leadId;
  const caseId = createCase(caseParams);

  // 리드 상태 업데이트
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.LEADS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('lead_id')] === leadId) {
      sheet.getRange(i + 1, headers.indexOf('converted_to_case_id') + 1).setValue(caseId);
      sheet.getRange(i + 1, headers.indexOf('lead_status') + 1)
        .setValue(CONFIG.LEAD_STATUS.CONVERTED);
      break;
    }
  }

  return caseId;
}

/**
 * 병원 검토 요청
 * @param {string} caseId
 * @param {string} requestedBy
 */
function requestHospitalReview(caseId, requestedBy) {
  const now = new Date();

  updateCaseField_(caseId, 'hospital_review_requested_at', now);

  // Medical Review 레코드 생성
  const caseData = getCaseData_(caseId);
  if (caseData) {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const reviewSheet = ss.getSheetByName(CONFIG.SHEETS.MEDICAL_REVIEWS);
    const reviewId = generateCustomId(CONFIG.SHEETS.MEDICAL_REVIEWS, 'REV', 'review_id');

    reviewSheet.appendRow([
      reviewId,
      caseId,
      caseData.hospital_id,
      now,                            // review_request_date
      '',                             // review_completed_date
      '',                             // hospital_user
      CONFIG.REVIEW_STATUS.PENDING,   // review_status
      '',                             // review_result (비어있음 — 심사 완료 후 입력)
      '',                             // next_medical_step
      '',                             // consultation_date
      '',                             // additional_test_required
      '',                             // medical_notes_link
      '',                             // notes
    ]);

    addActivityLog({
      caseId,
      actorEmail: requestedBy,
      actorRole: 'MSO Coordinator',
      actionType: 'HOSPITAL_REVIEW_REQUESTED',
      summary: `병원 검토 요청: ${caseData.hospital_id}에 검토 요청`,
      nextAction: '병원 검토 결과 대기',
    });
  }
}

/**
 * 케이스 특정 필드 업데이트 + Audit Log
 */
function updateCaseField_(caseId, fieldName, newValue, changedBy) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.CASES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIdx = headers.indexOf(fieldName);

  if (colIdx === -1) return;

  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('case_id')] !== caseId) continue;

    const oldValue = data[i][colIdx];
    sheet.getRange(i + 1, colIdx + 1).setValue(newValue);

    if (String(oldValue) !== String(newValue)) {
      createAuditLog(
        'Cases', caseId, fieldName, oldValue, newValue,
        changedBy || Session.getActiveUser().getEmail(), 'Apps Script'
      );
    }
    return;
  }
}

/**
 * 케이스 데이터 조회
 */
function getCaseData_(caseId) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.CASES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('case_id')] === caseId) {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = data[i][idx]; });
      return obj;
    }
  }
  return null;
}

/**
 * Google Drive 케이스 폴더 생성
 * 구조: MSO-ERP-Cases / CASE-2026-001_P26XXXX
 */
function createCaseDriveFolder_(caseId, patientCode) {
  try {
    const rootFolderName = CONFIG.DRIVE_ROOT_FOLDER_NAME;
    let rootFolder;

    const found = DriveApp.getFoldersByName(rootFolderName);
    rootFolder = found.hasNext() ? found.next() : DriveApp.createFolder(rootFolderName);

    const folderName = `${caseId}_${patientCode}`;
    const caseFolder = rootFolder.createFolder(folderName);

    // 하위 폴더 구조
    ['01_환자문서', '02_의료기록', '03_공급업체문서', '04_결제', '05_기타'].forEach(sub => {
      caseFolder.createFolder(sub);
    });

    return { id: caseFolder.getId(), url: caseFolder.getUrl() };
  } catch (err) {
    Logger.log(`Drive 폴더 생성 실패: ${err.message}`);
    return null;
  }
}

/**
 * 환자 코드 조회
 */
function getPatientCode_(patientId) {
  if (!patientId) return 'UNKNOWN';
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PATIENTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('patient_id')] === patientId) {
      return data[i][headers.indexOf('patient_code')] || patientId;
    }
  }
  return patientId;
}
