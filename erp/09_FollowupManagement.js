// MSO ERP - 추적관찰 관리 모듈

/**
 * 시술일 입력 시 기본 Follow-up 레코드 자동 생성
 * D7, D30, D90, D180 스케줄 생성
 * @param {string} caseId
 * @param {Date} treatmentDate
 */
function createDefaultFollowups(caseId, treatmentDate) {
  const caseData = getCaseData_(caseId);
  if (!caseData) return;

  const baseDate = new Date(treatmentDate);
  const stages = [
    { stage: 'D7', days: 7 },
    { stage: 'D30', days: 30 },
    { stage: 'D90', days: 90 },
    { stage: 'D180', days: 180 },
  ];

  stages.forEach(({ stage, days }) => {
    const dueDate = addDays_(baseDate, days);
    const followupId = createFollowupRecord_({
      caseId,
      stage,
      dueDate,
      responsibleParty: caseData.assigned_coordinator,
    });

    // 캘린더 이벤트
    const eventId = createFollowupEvent(caseId, stage, dueDate, followupId);

    // 캘린더 이벤트 ID를 Followups에 저장
    updateFollowupField_(followupId, 'calendar_event_id', eventId);
  });

  addActivityLog({
    caseId,
    actionType: 'FOLLOWUP_SCHEDULE_CREATED',
    summary: `시술 완료 후 추적관찰 일정 자동 생성: D7, D30, D90, D180`,
    nextAction: 'D7 추적관찰 연락',
    nextActionDate: addDays_(baseDate, 7),
  });
}

/**
 * 추가 Follow-up 레코드 생성 (커스텀)
 * @param {Object} params
 * @returns {string} followup_id
 */
function createCustomFollowup(params) {
  return createFollowupRecord_({
    caseId: params.caseId,
    stage: params.stage || 'Custom',
    dueDate: params.dueDate,
    responsibleParty: params.responsibleParty,
    notes: params.notes,
  });
}

/**
 * 추적관찰 완료 처리
 * @param {string} followupId
 * @param {Object} params
 * @param {string} params.patientResponse
 * @param {string} params.notes
 * @param {boolean} params.escalationRequired
 * @param {string} params.completedBy
 */
function completeFollowup(followupId, params) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.FOLLOWUPS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('followup_id')] !== followupId) continue;

    const caseId = data[i][headers.indexOf('case_id')];
    const stage = data[i][headers.indexOf('followup_stage')];
    const now = new Date();

    sheet.getRange(i + 1, headers.indexOf('completed_date') + 1).setValue(now);
    sheet.getRange(i + 1, headers.indexOf('patient_response') + 1)
      .setValue(params.patientResponse || '');
    sheet.getRange(i + 1, headers.indexOf('followup_notes') + 1)
      .setValue(params.notes || '');
    sheet.getRange(i + 1, headers.indexOf('escalation_required') + 1)
      .setValue(!!params.escalationRequired);
    const nextVisitCol = headers.indexOf('next_visit_date');
    if (nextVisitCol >= 0 && params.nextVisitDate) {
      sheet.getRange(i + 1, nextVisitCol + 1).setValue(new Date(params.nextVisitDate));
    }

    createAuditLog('Followups', followupId, 'completed_date', '', now,
      params.completedBy, 'Apps Script');

    addActivityLog({
      caseId,
      actorEmail: params.completedBy,
      actorRole: 'MSO Coordinator',
      actionType: 'FOLLOWUP_COMPLETED',
      summary: `추적관찰 완료: ${stage}`,
    });

    if (params.escalationRequired) {
      notifyEscalation_(caseId, followupId, stage, params.notes);
    }

    // 모든 Follow-up 완료 여부 확인 후 케이스 Closed 처리
    checkAndCloseCase_(caseId);
    return;
  }
}

/**
 * 기한 초과 추적관찰 목록 조회
 * @returns {Array<Object>}
 */
function getOverdueFollowups() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.FOLLOWUPS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const today = new Date();

  return data.slice(1)
    .filter(row => {
      const dueDate = row[headers.indexOf('due_date')];
      const completed = row[headers.indexOf('completed_date')];
      return dueDate && !completed && new Date(dueDate) < today;
    })
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
}

// ─── 내부 헬퍼 ───────────────────────────────────────────────

function createFollowupRecord_(params) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.FOLLOWUPS);
  const followupId = generateCustomId(CONFIG.SHEETS.FOLLOWUPS, 'FUP', 'followup_id');

  sheet.appendRow([
    followupId,
    params.caseId,
    params.stage,
    params.dueDate || '',
    '', // completed_date
    params.responsibleParty || '',
    false,   // escalation_required (Boolean)
    '', // patient_response
    params.notes || '',
    '', // calendar_event_id
  ]);

  return followupId;
}

function updateFollowupField_(followupId, fieldName, newValue) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.FOLLOWUPS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIdx = headers.indexOf(fieldName);

  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('followup_id')] === followupId) {
      sheet.getRange(i + 1, colIdx + 1).setValue(newValue);
      return;
    }
  }
}

function checkAndCloseCase_(caseId) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.FOLLOWUPS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const caseFollowups = data.slice(1).filter(row =>
    row[headers.indexOf('case_id')] === caseId
  );

  const allDone = caseFollowups.every(row => row[headers.indexOf('completed_date')]);

  if (allDone && caseFollowups.length > 0) {
    try {
      changeCaseStatus(caseId, CONFIG.CASE_STATUS.CLOSED, 'system@mso-erp', 'MSO Admin');
    } catch (e) {
      // 이미 Closed이거나 전이 불가 상태면 무시
    }
  }
}

function notifyEscalation_(caseId, followupId, stage, notes) {
  const caseData = getCaseData_(caseId);
  if (!caseData) return;
  sendEmail_(
    caseData.assigned_coordinator,
    `[MSO-ERP] 에스컬레이션 필요 - ${caseId} ${stage}`,
    `케이스 ${caseId}의 ${stage} 추적관찰에서 에스컬레이션이 필요합니다.\n\n내용: ${notes || '미기재'}`
  );
}
