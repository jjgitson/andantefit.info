// MSO ERP - 트리거 관리 모듈
// 이 파일의 함수들을 Apps Script 편집기에서 수동 실행하여 트리거를 등록합니다

/**
 * 모든 트리거 초기화 (기존 트리거 삭제 후 재등록)
 * 최초 1회 또는 재설정 필요 시 실행
 */
function setupAllTriggers() {
  // 기존 트리거 전체 삭제
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  // 1. onEdit 트리거 - 감사 추적
  ScriptApp.newTrigger('onEditAuditHandler')
    .forSpreadsheet(CONFIG.SPREADSHEET_ID)
    .onEdit()
    .create();

  // 2. 매일 오전 9시 - 리마인드 배치
  ScriptApp.newTrigger('runDueDateReminderJob')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .inTimezone('Asia/Seoul')
    .create();

  // 3. 매주 월요일 오전 8시 - 주간 지연 케이스 요약
  ScriptApp.newTrigger('runWeeklySummaryJob')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .inTimezone('Asia/Seoul')
    .create();

  // 4. 15분마다 - 구글 캘린더 → ERP 역방향 동기화
  ScriptApp.newTrigger('syncCalendarChangesToERP')
    .timeBased()
    .everyMinutes(15)
    .create();

  Logger.log('트리거 설정 완료');
  SpreadsheetApp.getUi().alert('트리거 설정이 완료되었습니다.\n- onEdit 감사 추적\n- 매일 09:00 리마인드\n- 매주 월요일 08:00 주간 요약\n- 15분마다 캘린더 역동기화');
}

/**
 * 현재 등록된 트리거 목록 확인
 */
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    Logger.log(`트리거: ${t.getHandlerFunction()} / 타입: ${t.getEventType()}`);
  });
  Logger.log(`총 트리거 수: ${triggers.length}`);
}

/**
 * 주간 지연 케이스 요약 이메일 (월요일 배치)
 */
function runWeeklySummaryJob() {
  const delayed = getDelayedSupplierOrders();
  const overdueFollowups = getOverdueFollowups();
  const outstanding = getOutstandingPayments();

  // MSO Admin에게 주간 요약 발송
  // Admin 이메일은 Master_Calendar_Config 또는 별도 설정 시트에서 관리 가능
  const adminEmail = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');
  if (!adminEmail) {
    Logger.log('ADMIN_EMAIL 스크립트 속성이 설정되지 않았습니다.');
    return;
  }

  const body = [
    `=== MSO-ERP 주간 운영 요약 (${Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd')}) ===\n`,
    `▶ 납기 지연 공급 주문: ${delayed.length}건`,
    delayed.map(o => `  - ${o.supplier_order_id} (${o.case_id})`).join('\n'),
    '',
    `▶ 기한 초과 추적관찰: ${overdueFollowups.length}건`,
    overdueFollowups.map(f => `  - ${f.followup_id} (${f.case_id}, ${f.followup_stage})`).join('\n'),
    '',
    `▶ 미수금 케이스: ${outstanding.length}건`,
    outstanding.map(b => `  - ${b.billing_id} (${b.case_id}), 미수: ${b._outstanding}`).join('\n'),
  ].join('\n');

  sendEmail_(adminEmail, `주간 운영 요약`, body);
}

/**
 * 스크립트 속성에 Admin 이메일 저장
 * 최초 설정 시 실행
 */
function setAdminEmail() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt('MSO Admin 이메일 주소를 입력하세요:');
  if (result.getSelectedButton() === ui.Button.OK) {
    PropertiesService.getScriptProperties().setProperty('ADMIN_EMAIL', result.getResponseText());
    ui.alert(`Admin 이메일이 저장되었습니다: ${result.getResponseText()}`);
  }
}

// ─── 메뉴 등록 (스프레드시트 열릴 때 자동 실행) ──────────────

/**
 * 스프레드시트 열릴 때 커스텀 메뉴 추가
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('MSO-ERP')
    .addItem('시트 초기화', 'setupAllSheets')
    .addSeparator()
    .addItem('트리거 설정', 'setupAllTriggers')
    .addItem('트리거 목록 확인', 'listTriggers')
    .addSeparator()
    .addItem('Admin 이메일 설정', 'setAdminEmail')
    .addSeparator()
    .addItem('리마인드 즉시 실행', 'runDueDateReminderJob')
    .addItem('주간 요약 즉시 실행', 'runWeeklySummaryJob')
    .addItem('캘린더 역동기화 즉시 실행', 'syncCalendarChangesToERP')
    .addToUi();
}

// ─── 캘린더 → ERP 역방향 동기화 ──────────────────────────────

/**
 * 구글 캘린더에서 이벤트를 이동하면 해당 ERP 레코드 날짜를 자동 업데이트.
 * setupAllTriggers()로 15분마다 실행되도록 등록.
 */
function syncCalendarChangesToERP() {
  const props = PropertiesService.getScriptProperties();
  const lastSyncStr = props.getProperty('LAST_CAL_SYNC');
  const lastSyncTime = lastSyncStr ? new Date(lastSyncStr) : new Date(Date.now() - 20 * 60 * 1000);
  const now = new Date();

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  // 과거 30일 ~ 미래 365일 범위 이벤트를 폴링 (Google Calendar에는 updatedMin API가 없어 날짜로 필터)
  const searchStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const searchEnd   = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  // MSO_MASTER는 집합 캘린더라 중복 처리되므로 개별 캘린더만 폴링
  const calTypes = [
    CONFIG.CALENDAR_TYPES.HOSPITAL_COORD,
    CONFIG.CALENDAR_TYPES.SUPPLIER_LOGISTICS,
    CONFIG.CALENDAR_TYPES.BILLING_DEADLINE,
  ];

  const processed = {};  // entity:id:field → true (중복 방지)

  calTypes.forEach(calType => {
    try {
      const calId = getCalendarId_(calType);
      const calendar = CalendarApp.getCalendarById(calId);
      if (!calendar) return;

      const events = calendar.getEvents(searchStart, searchEnd);
      events.forEach(event => {
        try {
          if (event.getLastUpdated() <= lastSyncTime) return;

          const entity = event.getTag('ERP_ENTITY');
          const id     = event.getTag('ERP_ID');
          const field  = event.getTag('ERP_FIELD');
          if (!entity || !id || !field) return;

          const key = `${entity}:${id}:${field}`;
          if (processed[key]) return;
          processed[key] = true;

          updateErpFieldFromCalendar_(ss, entity, id, field, event.getStartTime());
        } catch (eInner) {
          Logger.log(`이벤트 처리 오류: ${eInner.message}`);
        }
      });
    } catch (e) {
      Logger.log(`캘린더 동기화 오류 [${calType}]: ${e.message}`);
    }
  });

  props.setProperty('LAST_CAL_SYNC', now.toISOString());
  Logger.log(`캘린더 역동기화 완료: ${now.toISOString()}`);
}

function updateErpFieldFromCalendar_(ss, entity, id, field, newDate) {
  const entityMap = {
    case:           { sheet: CONFIG.SHEETS.CASES,           idCol: 'case_id' },
    supplier_order: { sheet: CONFIG.SHEETS.SUPPLIER_ORDERS, idCol: 'supplier_order_id' },
    billing:        { sheet: CONFIG.SHEETS.BILLING,         idCol: 'billing_id' },
    followup:       { sheet: CONFIG.SHEETS.FOLLOWUPS,       idCol: 'followup_id' },
  };
  const meta = entityMap[entity];
  if (!meta) return;

  const sheet = ss.getSheetByName(meta.sheet);
  if (!sheet) return;

  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idIdx    = headers.indexOf(meta.idCol);
  const fieldIdx = headers.indexOf(field);
  if (idIdx < 0 || fieldIdx < 0) return;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idIdx]) !== String(id)) continue;

    const oldVal = rows[i][fieldIdx];
    const newDateOnly = Utilities.formatDate(newDate, 'Asia/Seoul', 'yyyy-MM-dd');
    const oldDateOnly = oldVal ? Utilities.formatDate(new Date(oldVal), 'Asia/Seoul', 'yyyy-MM-dd') : '';
    if (newDateOnly === oldDateOnly) return;  // 변경 없음

    sheet.getRange(i + 1, fieldIdx + 1).setValue(newDate);
    invalidateCache_(meta.sheet);

    const caseIdIdx = headers.indexOf('case_id');
    const caseId = (caseIdIdx >= 0 ? rows[i][caseIdIdx] : '') || '';

    createAuditLog(meta.sheet, id, field, oldVal, newDate, 'calendar-sync', 'Google Calendar');
    addActivityLog({
      caseId: entity === 'case' ? id : caseId,
      actorEmail: 'calendar-sync@system',
      actorRole: 'System',
      actionType: 'CALENDAR_SYNC_UPDATE',
      summary: `캘린더 이동 감지 → ${field}: ${oldDateOnly} → ${newDateOnly}`,
    });

    Logger.log(`캘린더 역동기화: ${entity} ${id}.${field} ${oldDateOnly} → ${newDateOnly}`);
    return;
  }
}
