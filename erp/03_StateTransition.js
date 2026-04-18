// MSO ERP - 상태 전이 검증 모듈

/**
 * 상태 전이 허용 여부 검증
 * Master_Status_Transitions 시트 기준으로 판단
 * @param {string} entityName - 'Cases', 'Leads' 등
 * @param {string} currentStatus - 현재 상태
 * @param {string} targetStatus - 전이할 상태
 * @param {string} userRole - 요청 사용자 역할 (옵션)
 * @returns {{ allowed: boolean, reason: string }}
 */
function validateStateTransition(entityName, currentStatus, targetStatus, userRole) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MASTER_TRANSITIONS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const colEntity = headers.indexOf('entity_name');
  const colFrom = headers.indexOf('from_status');
  const colTo = headers.indexOf('to_status');
  const colRoles = headers.indexOf('allowed_roles');

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (
      row[colEntity] === entityName &&
      row[colFrom] === currentStatus &&
      row[colTo] === targetStatus
    ) {
      if (userRole) {
        const allowedRoles = String(row[colRoles]).split(',').map(r => r.trim());
        if (!allowedRoles.includes(userRole)) {
          return { allowed: false, reason: `역할 '${userRole}'은 이 전이를 수행할 권한이 없습니다.` };
        }
      }
      return { allowed: true, reason: '' };
    }
  }

  return {
    allowed: false,
    reason: `'${currentStatus}' → '${targetStatus}' 전이는 허용되지 않습니다.`,
  };
}

/**
 * 케이스 상태를 변경하고 관련 자동화를 실행
 * @param {string} caseId
 * @param {string} targetStatus
 * @param {string} changedBy - 변경자 이메일
 * @param {string} userRole - 변경자 역할
 * @returns {boolean} 성공 여부
 */
function changeCaseStatus(caseId, targetStatus, changedBy, userRole) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.CASES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const colCaseId = headers.indexOf('case_id');
  const colStatus = headers.indexOf('case_status');

  for (let i = 1; i < data.length; i++) {
    if (data[i][colCaseId] !== caseId) continue;

    const currentStatus = data[i][colStatus];
    const validation = validateStateTransition('Cases', currentStatus, targetStatus, userRole);

    if (!validation.allowed) {
      Logger.log(`상태 전이 거부: ${caseId} - ${validation.reason}`);
      throw new Error(validation.reason);
    }

    const rowNum = i + 1;

    // 감사 로그 기록
    createAuditLog(
      'Cases', caseId, 'case_status',
      currentStatus, targetStatus,
      changedBy, 'Apps Script'
    );

    // 상태 업데이트
    sheet.getRange(rowNum, colStatus + 1).setValue(targetStatus);

    // 종료일 처리
    if (targetStatus === CONFIG.CASE_STATUS.CLOSED || targetStatus === CONFIG.CASE_STATUS.CANCELLED) {
      const colClosedAt = headers.indexOf('case_closed_at');
      sheet.getRange(rowNum, colClosedAt + 1).setValue(new Date());
    }

    // 활동 로그
    addActivityLog({
      caseId,
      actorEmail: changedBy,
      actorRole: userRole || 'System',
      actionType: 'STATUS_CHANGE',
      summary: `케이스 상태 변경: ${currentStatus} → ${targetStatus}`,
    });

    // 상태별 후속 자동화
    onCaseStatusChanged_(caseId, currentStatus, targetStatus, data[i], headers);

    return true;
  }

  throw new Error(`케이스를 찾을 수 없습니다: ${caseId}`);
}

/**
 * 상태 변경 후 자동화 디스패처
 */
function onCaseStatusChanged_(caseId, oldStatus, newStatus, rowData, headers) {
  const get = (col) => rowData[headers.indexOf(col)];

  switch (newStatus) {
    case CONFIG.CASE_STATUS.UNDER_HOSPITAL_REVIEW:
      createCalendarEvent(
        CONFIG.CALENDAR_TYPES.HOSPITAL_COORD,
        `[검토] ${get('case_id')} - ${get('hospital_id')}`,
        addDays_(new Date(), 3),
        buildEventDescription_(caseId, '병원 검토 마감')
      );
      notifyStatusChange(caseId, newStatus);
      break;

    case CONFIG.CASE_STATUS.HOSPITAL_APPROVED:
      notifyStatusChange(caseId, newStatus);
      break;

    case CONFIG.CASE_STATUS.SHIPMENT_IN_TRANSIT:
      notifyStatusChange(caseId, newStatus);
      break;

    case CONFIG.CASE_STATUS.ACCEPTANCE_CHECK_PENDING:
      createCalendarEvent(
        CONFIG.CALENDAR_TYPES.HOSPITAL_COORD,
        `[검수] ${caseId} - ${get('hospital_id')}`,
        new Date(),
        buildEventDescription_(caseId, '입고 검수 대기')
      );
      break;

    case CONFIG.CASE_STATUS.COMPLETED:
      createDefaultFollowups(caseId, get('treatment_date'));
      notifyStatusChange(caseId, newStatus);
      break;

    case CONFIG.CASE_STATUS.CLOSED:
    case CONFIG.CASE_STATUS.CANCELLED:
      notifyStatusChange(caseId, newStatus);
      break;
  }
}

/**
 * 이벤트 설명 블록 생성 헬퍼
 */
function buildEventDescription_(caseId, context) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.CASES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('case_id')] !== caseId) continue;
    const get = (col) => data[i][headers.indexOf(col)] || '';
    return [
      `케이스 ID: ${caseId}`,
      `환자 코드: ${get('patient_id')}`,
      `병원: ${get('hospital_id')}`,
      `공급업체: ${get('supplier_id')}`,
      `상태: ${get('case_status')}`,
      `담당자: ${get('assigned_coordinator')}`,
      `컨텍스트: ${context}`,
    ].join('\n');
  }
  return `케이스 ID: ${caseId}\n컨텍스트: ${context}`;
}

function addDays_(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
