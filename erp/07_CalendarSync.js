// MSO ERP - Google Calendar 연동 모듈

/**
 * Master_Calendar_Config에서 Calendar ID 조회
 * @param {string} calendarType - CONFIG.CALENDAR_TYPES 값
 * @returns {string} Google Calendar ID
 */
function getCalendarId_(calendarType) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MASTER_CALENDAR);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (
      data[i][headers.indexOf('calendar_type')] === calendarType &&
      (data[i][headers.indexOf('active')] === true || data[i][headers.indexOf('active')] === 'TRUE')
    ) {
      return data[i][headers.indexOf('calendar_id')];
    }
  }
  throw new Error(`캘린더 설정을 찾을 수 없습니다: ${calendarType}`);
}

/**
 * Google Calendar 이벤트 생성
 * @param {string} calendarType
 * @param {string} title
 * @param {Date} startTime
 * @param {string} description
 * @param {Date} [endTime] - 생략 시 startTime + 1시간
 * @returns {string} 생성된 이벤트 ID
 */
/**
 * @param {Object} [erpMeta] - { entity: 'case'|'supplier_order'|'billing'|'followup', id: string, field: string }
 *   When set, tags the event so syncCalendarChangesToERP can write back when event is moved.
 */
function createCalendarEvent(calendarType, title, startTime, description, endTime, erpMeta) {
  try {
    const calendarId = getCalendarId_(calendarType);
    const calendar = calendarId === 'primary'
      ? CalendarApp.getDefaultCalendar()
      : CalendarApp.getCalendarById(calendarId);

    if (!calendar) {
      Logger.log(`캘린더를 찾을 수 없습니다: ${calendarId}`);
      return null;
    }

    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date(start.getTime() + 60 * 60 * 1000);

    const event = calendar.createEvent(title, start, end, {
      description: description || '',
    });

    if (erpMeta && erpMeta.entity) {
      event.setTag('ERP_ENTITY', erpMeta.entity);
      event.setTag('ERP_ID',     erpMeta.id     || '');
      event.setTag('ERP_FIELD',  erpMeta.field  || '');
    }

    Logger.log(`캘린더 이벤트 생성: [${calendarType}] ${title}`);
    return event.getId();
  } catch (err) {
    Logger.log(`캘린더 이벤트 생성 실패: ${err.message}`);
    return null;
  }
}

/**
 * 캘린더 이벤트 날짜 변경 (ERP에서 날짜를 수정할 때 호출)
 */
function rescheduleCalendarEvent(calendarType, eventId, newDate) {
  try {
    const calendarId = getCalendarId_(calendarType);
    const calendar = calendarId === 'primary'
      ? CalendarApp.getDefaultCalendar()
      : CalendarApp.getCalendarById(calendarId);
    const event = calendar.getEventById(eventId);
    if (!event) return;
    const start = new Date(newDate);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    event.setTime(start, end);
  } catch (err) {
    Logger.log(`캘린더 이벤트 날짜 변경 실패: ${err.message}`);
  }
}

/**
 * 이벤트 제목 업데이트
 * @param {string} calendarType
 * @param {string} eventId
 * @param {string} newTitle
 * @param {string} [newDescription]
 */
function updateCalendarEvent(calendarType, eventId, newTitle, newDescription) {
  try {
    const calendarId = getCalendarId_(calendarType);
    const calendar = calendarId === 'primary'
      ? CalendarApp.getDefaultCalendar()
      : CalendarApp.getCalendarById(calendarId);

    const event = calendar.getEventById(eventId);
    if (!event) return;

    if (newTitle) event.setTitle(newTitle);
    if (newDescription) event.setDescription(newDescription);
  } catch (err) {
    Logger.log(`캘린더 이벤트 업데이트 실패: ${err.message}`);
  }
}

/**
 * 이벤트 삭제
 * @param {string} calendarType
 * @param {string} eventId
 */
function deleteCalendarEvent(calendarType, eventId) {
  try {
    const calendarId = getCalendarId_(calendarType);
    const calendar = calendarId === 'primary'
      ? CalendarApp.getDefaultCalendar()
      : CalendarApp.getCalendarById(calendarId);

    const event = calendar.getEventById(eventId);
    if (event) event.deleteEvent();
  } catch (err) {
    Logger.log(`캘린더 이벤트 삭제 실패: ${err.message}`);
  }
}

// ─── 도메인별 캘린더 이벤트 생성 헬퍼 ────────────────────────

/**
 * 시술일 확정 시 캘린더 이벤트 생성
 * @param {string} caseId
 * @param {Date} treatmentDate
 * @param {string} patientCode
 * @param {string} coordinatorName
 * @param {string} hospitalId
 */
function createTreatmentDayEvent(caseId, treatmentDate, patientCode, coordinatorName, hospitalId) {
  const title = `[시술] ${patientCode} - ${coordinatorName}`;
  const desc = [
    `케이스 ID: ${caseId}`,
    `환자 코드: ${patientCode}`,
    `병원: ${hospitalId}`,
    `담당자: ${coordinatorName}`,
    `유형: 시술일`,
  ].join('\n');

  const erpMeta = { entity: 'case', id: caseId, field: 'treatment_date' };
  const msoEventId  = createCalendarEvent(CONFIG.CALENDAR_TYPES.MSO_MASTER,     title, treatmentDate, desc);
  const hospEventId = createCalendarEvent(CONFIG.CALENDAR_TYPES.HOSPITAL_COORD, title, treatmentDate, desc, null, erpMeta);

  return { msoEventId, hospEventId };
}

/**
 * 추적관찰 이벤트 생성
 * @param {string} caseId
 * @param {string} followupStage - 'D7', 'D30', etc.
 * @param {Date} dueDate
 */
function createFollowupEvent(caseId, followupStage, dueDate, followupId) {
  const title = `[추적] ${caseId} - Follow-up ${followupStage}`;
  const desc = `케이스 ID: ${caseId}\n추적관찰 단계: ${followupStage}\n마감일: ${Utilities.formatDate(new Date(dueDate), 'Asia/Seoul', 'yyyy-MM-dd')}`;
  const erpMeta = followupId ? { entity: 'followup', id: followupId, field: 'due_date' } : null;
  return createCalendarEvent(CONFIG.CALENDAR_TYPES.MSO_MASTER, title, new Date(dueDate), desc, null, erpMeta);
}

/**
 * 결제 마감일 이벤트 생성 → MSO_MASTER + BILLING_DEADLINE
 */
function createBillingDueEvent(caseId, patientCode, amount, dueDate, billingId) {
  const title = `[미납] ${patientCode} - ${amount}`;
  const desc = `케이스 ID: ${caseId}\n환자 코드: ${patientCode}\n청구금액: ${amount}\n결제 마감일: ${Utilities.formatDate(new Date(dueDate), 'Asia/Seoul', 'yyyy-MM-dd')}`;
  const d = new Date(dueDate);
  const erpMeta = billingId ? { entity: 'billing', id: billingId, field: 'due_date' } : null;
  const msoEventId     = createCalendarEvent(CONFIG.CALENDAR_TYPES.MSO_MASTER,       title, d, desc);
  const billingEventId = createCalendarEvent(CONFIG.CALENDAR_TYPES.BILLING_DEADLINE,  title, d, desc, null, erpMeta);
  return { msoEventId, billingEventId };
}

/**
 * 공급 출고 예정 이벤트 생성 → MSO_MASTER + SUPPLIER_LOGISTICS
 */
function createShipmentEtaEvent(caseId, supplierName, shipDate, orderId) {
  const title = `[출고] ${caseId} - ${supplierName}`;
  const desc = `케이스 ID: ${caseId}\n공급업체: ${supplierName}\n예상 출고일: ${Utilities.formatDate(new Date(shipDate), 'Asia/Seoul', 'yyyy-MM-dd')}`;
  const d = new Date(shipDate);
  const erpMeta = orderId ? { entity: 'supplier_order', id: orderId, field: 'expected_ship_date' } : null;
  const msoEventId       = createCalendarEvent(CONFIG.CALENDAR_TYPES.MSO_MASTER,          title, d, desc);
  const logisticsEventId = createCalendarEvent(CONFIG.CALENDAR_TYPES.SUPPLIER_LOGISTICS,   title, d, desc, null, erpMeta);
  return { msoEventId, logisticsEventId };
}

/**
 * 입고 검수 이벤트 생성 → MSO_MASTER + SUPPLIER_LOGISTICS + HOSPITAL_COORD
 */
function createAcceptanceCheckEvent(caseId, hospitalId, checkDate) {
  const title = `[검수] ${caseId} - ${hospitalId}`;
  const desc = `케이스 ID: ${caseId}\n병원: ${hospitalId}\n검수 예정일: ${Utilities.formatDate(new Date(checkDate), 'Asia/Seoul', 'yyyy-MM-dd')}`;
  const d = new Date(checkDate);

  const msoEventId      = createCalendarEvent(CONFIG.CALENDAR_TYPES.MSO_MASTER,          title, d, desc);
  const logisticsId     = createCalendarEvent(CONFIG.CALENDAR_TYPES.SUPPLIER_LOGISTICS,   title, d, desc);
  const hospId          = createCalendarEvent(CONFIG.CALENDAR_TYPES.HOSPITAL_COORD,       title, d, desc);
  return { msoEventId, logisticsId, hospId };
}
