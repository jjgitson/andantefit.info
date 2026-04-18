// MSO ERP - 알림 및 이메일 발송 모듈

/**
 * 이메일 발송 (공통 래퍼)
 * @param {string} to
 * @param {string} subject
 * @param {string} body
 */
function sendEmail_(to, subject, body) {
  if (!to) return;
  try {
    GmailApp.sendEmail(to, `[MSO-ERP] ${subject}`, body);
    Logger.log(`이메일 발송: ${to} - ${subject}`);
  } catch (err) {
    Logger.log(`이메일 발송 실패: ${err.message}`);
  }
}

/**
 * 케이스 상태 변경 알림
 * @param {string} caseId
 * @param {string} newStatus
 */
function notifyStatusChange(caseId, newStatus) {
  const caseData = getCaseData_(caseId);
  if (!caseData) return;

  const coordinator = caseData.assigned_coordinator;
  const patientCode = getPatientCode_(caseData.patient_id);

  const templates = {
    [CONFIG.CASE_STATUS.UNDER_HOSPITAL_REVIEW]: {
      subject: `병원 검토 요청 - ${caseId}`,
      body: `케이스 ${caseId} (${patientCode})가 병원 검토 단계로 이동했습니다.\n병원: ${caseData.hospital_id}\n검토 결과를 기다려 주세요.`,
    },
    [CONFIG.CASE_STATUS.HOSPITAL_APPROVED]: {
      subject: `병원 승인 완료 - ${caseId}`,
      body: `케이스 ${caseId} (${patientCode})가 병원 승인을 받았습니다.\n다음 단계: 공급업체 공급 조율을 진행해 주세요.`,
    },
    [CONFIG.CASE_STATUS.SHIPMENT_IN_TRANSIT]: {
      subject: `배송 시작 - ${caseId}`,
      body: `케이스 ${caseId}의 제품이 출고되어 배송 중입니다.\n병원 입고 검수 준비를 안내해 주세요.`,
    },
    [CONFIG.CASE_STATUS.COMPLETED]: {
      subject: `시술 완료 - ${caseId}`,
      body: `케이스 ${caseId} (${patientCode})의 시술이 완료되었습니다.\n추적관찰 일정이 자동 생성되었습니다.`,
    },
    [CONFIG.CASE_STATUS.CANCELLED]: {
      subject: `케이스 취소 - ${caseId}`,
      body: `케이스 ${caseId} (${patientCode})가 취소 처리되었습니다.`,
    },
  };

  const template = templates[newStatus];
  if (template && coordinator) {
    sendEmail_(coordinator, template.subject, template.body);
  }
}

// ─── 배치 리마인드 작업 ───────────────────────────────────────

/**
 * 매일 실행되는 리마인드 배치 작업
 * Triggers.js에서 시간 기반 트리거로 등록
 */
function runDueDateReminderJob() {
  Logger.log('리마인드 배치 시작: ' + new Date());

  remindHospitalReviewDue_();
  remindSupplierDelays_();
  remindFollowupsDue_();
  remindBillingDue_();
  remindExpiringDocuments_();

  Logger.log('리마인드 배치 완료');
}

/**
 * 병원 검토 기한 초과 알림 (요청 후 5일 이상 미응답)
 */
function remindHospitalReviewDue_() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.CASES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const today = new Date();

  data.slice(1).forEach(row => {
    const status = row[headers.indexOf('case_status')];
    const requestedAt = row[headers.indexOf('hospital_review_requested_at')];

    if (status !== CONFIG.CASE_STATUS.UNDER_HOSPITAL_REVIEW || !requestedAt) return;

    const daysDiff = Math.floor((today - new Date(requestedAt)) / (1000 * 60 * 60 * 24));
    if (daysDiff < 5) return;

    const caseId = row[headers.indexOf('case_id')];
    const coordinator = row[headers.indexOf('assigned_coordinator')];

    sendEmail_(
      coordinator,
      `병원 검토 지연 알림 - ${caseId}`,
      `케이스 ${caseId}의 병원 검토 요청 후 ${daysDiff}일이 경과했습니다.\n병원에 검토 결과를 독촉해 주세요.`
    );
  });
}

/**
 * 공급업체 납기 지연 알림
 */
function remindSupplierDelays_() {
  const delayed = getDelayedSupplierOrders();
  delayed.forEach(order => {
    const caseData = getCaseData_(order.case_id);
    if (!caseData) return;

    sendEmail_(
      caseData.assigned_coordinator,
      `공급 납기 지연 - ${order.supplier_order_id}`,
      `주문 ${order.supplier_order_id}의 예상 출고일(${order.expected_ship_date})이 초과되었습니다.\n공급업체에 확인해 주세요.`
    );
  });
}

/**
 * 추적관찰 기한 임박 알림 (D-3)
 */
function remindFollowupsDue_() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.FOLLOWUPS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const today = new Date();
  const threshold = addDays_(today, 3);

  data.slice(1).forEach(row => {
    const dueDate = row[headers.indexOf('due_date')];
    const completed = row[headers.indexOf('completed_date')];
    if (!dueDate || completed) return;

    const due = new Date(dueDate);
    if (due < today || due > threshold) return;

    const caseId = row[headers.indexOf('case_id')];
    const stage = row[headers.indexOf('followup_stage')];
    const responsible = row[headers.indexOf('responsible_party')];

    sendEmail_(
      responsible,
      `추적관찰 예정 알림 - ${caseId} ${stage}`,
      `케이스 ${caseId}의 ${stage} 추적관찰 마감이 ${Utilities.formatDate(due, 'Asia/Seoul', 'yyyy-MM-dd')}입니다.\n환자 연락을 준비해 주세요.`
    );
  });
}

/**
 * 결제 마감 임박 알림 (D-3)
 */
function remindBillingDue_() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.BILLING);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const today = new Date();
  const threshold = addDays_(today, CONFIG.BILLING_REMINDER_DAYS);

  const unpaidStatuses = [CONFIG.PAYMENT_STATUS.INVOICE_SENT, CONFIG.PAYMENT_STATUS.PARTIALLY_PAID];

  data.slice(1).forEach(row => {
    const status = row[headers.indexOf('payment_status')];
    const dueDate = row[headers.indexOf('due_date')];
    if (!unpaidStatuses.includes(status) || !dueDate) return;

    const due = new Date(dueDate);
    if (due < today || due > threshold) return;

    const caseId = row[headers.indexOf('case_id')];
    const amount = row[headers.indexOf('invoice_amount')];
    const caseData = getCaseData_(caseId);
    if (!caseData) return;

    sendEmail_(
      caseData.assigned_coordinator,
      `결제 마감 임박 - ${caseId}`,
      `케이스 ${caseId}의 결제 마감일이 ${Utilities.formatDate(due, 'Asia/Seoul', 'yyyy-MM-dd')}입니다.\n미수금액: ${amount}\n환자에게 결제를 안내해 주세요.`
    );
  });
}

/**
 * 문서 만료 임박 알림
 */
function remindExpiringDocuments_() {
  const expiring = getExpiringDocuments();
  expiring.forEach(doc => {
    const caseData = getCaseData_(doc.case_id);
    if (!caseData) return;

    sendEmail_(
      caseData.assigned_coordinator,
      `문서 만료 임박 - ${doc.case_id}`,
      `케이스 ${doc.case_id}의 문서 [${doc.document_type}]이 ${doc.expiry_date}에 만료됩니다.\n갱신이 필요하면 새 버전을 업로드해 주세요.`
    );
  });
}
