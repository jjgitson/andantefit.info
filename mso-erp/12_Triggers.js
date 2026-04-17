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

  Logger.log('트리거 설정 완료');
  SpreadsheetApp.getUi().alert('트리거 설정이 완료되었습니다.\n- onEdit 감사 추적\n- 매일 09:00 리마인드\n- 매주 월요일 08:00 주간 요약');
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
    .addToUi();
}
