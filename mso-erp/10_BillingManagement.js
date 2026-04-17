// MSO ERP - 결제 및 청구 관리 모듈

/**
 * 청구 레코드 생성
 * @param {Object} params
 * @returns {string} billing_id
 */
function createBillingRecord(params) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.BILLING);

  const billingId = generateCustomId(CONFIG.SHEETS.BILLING, 'BILL', 'billing_id');

  sheet.appendRow([
    billingId,
    params.caseId,
    params.quoteNo || '',
    params.invoiceNo || '',
    params.currency || 'KRW',
    params.quoteAmount || 0,
    params.invoiceAmount || 0,
    0, // paid_amount
    CONFIG.PAYMENT_STATUS.NOT_ISSUED,
    params.dueDate || '',
    '', // paid_date
    0, // refund_amount
    '', // calendar_event_id
    params.notes || '',
  ]);

  addActivityLog({
    caseId: params.caseId,
    actorEmail: params.createdBy,
    actorRole: 'Finance User',
    actionType: 'BILLING_CREATED',
    summary: `청구 레코드 생성: ${billingId}`,
  });

  return billingId;
}

/**
 * 견적 발행
 * @param {string} billingId
 * @param {Object} params
 */
function issueQuote(billingId, params) {
  const billing = getBillingData_(billingId);
  if (!billing) throw new Error(`청구 레코드를 찾을 수 없습니다: ${billingId}`);

  updateBillingField_(billingId, 'quote_no', params.quoteNo, params.issuedBy);
  updateBillingField_(billingId, 'quote_amount', params.quoteAmount, params.issuedBy);
  updateBillingField_(billingId, 'due_date', params.dueDate, params.issuedBy);
  updateBillingField_(billingId, 'payment_status', CONFIG.PAYMENT_STATUS.QUOTE_SENT, params.issuedBy);

  // 결제 마감일 캘린더 이벤트
  if (params.dueDate) {
    const caseData = getCaseData_(billing.case_id);
    const patientCode = caseData ? getPatientCode_(caseData.patient_id) : billing.case_id;
    const eventId = createBillingDueEvent(
      billing.case_id, patientCode, params.quoteAmount, new Date(params.dueDate)
    );
    updateBillingField_(billingId, 'calendar_event_id', eventId, params.issuedBy);
  }

  addActivityLog({
    caseId: billing.case_id,
    actorEmail: params.issuedBy,
    actorRole: 'Finance User',
    actionType: 'QUOTE_ISSUED',
    summary: `견적 발행: ${params.quoteNo}, 금액: ${params.quoteAmount}`,
  });
}

/**
 * 인보이스 발행
 * @param {string} billingId
 * @param {Object} params
 */
function issueInvoice(billingId, params) {
  const billing = getBillingData_(billingId);
  if (!billing) throw new Error(`청구 레코드를 찾을 수 없습니다: ${billingId}`);

  updateBillingField_(billingId, 'invoice_no', params.invoiceNo, params.issuedBy);
  updateBillingField_(billingId, 'invoice_amount', params.invoiceAmount, params.issuedBy);
  updateBillingField_(billingId, 'due_date', params.dueDate, params.issuedBy);
  updateBillingField_(billingId, 'payment_status', CONFIG.PAYMENT_STATUS.INVOICE_SENT, params.issuedBy);

  addActivityLog({
    caseId: billing.case_id,
    actorEmail: params.issuedBy,
    actorRole: 'Finance User',
    actionType: 'INVOICE_ISSUED',
    summary: `인보이스 발행: ${params.invoiceNo}, 금액: ${params.invoiceAmount}`,
  });
}

/**
 * 입금 처리
 * @param {string} billingId
 * @param {Object} params
 * @param {number} params.paidAmount
 * @param {Date} params.paidDate
 * @param {string} params.processedBy
 */
function recordPayment(billingId, params) {
  const billing = getBillingData_(billingId);
  if (!billing) throw new Error(`청구 레코드를 찾을 수 없습니다: ${billingId}`);

  const newPaidAmount = (Number(billing.paid_amount) || 0) + Number(params.paidAmount);
  const invoiceAmount = Number(billing.invoice_amount) || 0;

  updateBillingField_(billingId, 'paid_amount', newPaidAmount, params.processedBy);
  updateBillingField_(billingId, 'paid_date', params.paidDate || new Date(), params.processedBy);

  const newStatus = newPaidAmount >= invoiceAmount
    ? CONFIG.PAYMENT_STATUS.PAID
    : CONFIG.PAYMENT_STATUS.PARTIALLY_PAID;

  updateBillingField_(billingId, 'payment_status', newStatus, params.processedBy);

  // 결제 완료 시 캘린더 이벤트 삭제
  if (newStatus === CONFIG.PAYMENT_STATUS.PAID && billing.calendar_event_id) {
    deleteCalendarEvent(CONFIG.CALENDAR_TYPES.BILLING_DEADLINE, billing.calendar_event_id);
  }

  addActivityLog({
    caseId: billing.case_id,
    actorEmail: params.processedBy,
    actorRole: 'Finance User',
    actionType: 'PAYMENT_RECORDED',
    summary: `입금 처리: ${params.paidAmount} (누적: ${newPaidAmount} / ${invoiceAmount})`,
  });
}

/**
 * 미수금 목록 조회
 * @returns {Array<Object>}
 */
function getOutstandingPayments() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.BILLING);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const unpaidStatuses = [
    CONFIG.PAYMENT_STATUS.INVOICE_SENT,
    CONFIG.PAYMENT_STATUS.PARTIALLY_PAID,
    CONFIG.PAYMENT_STATUS.QUOTE_SENT,
  ];

  return data.slice(1)
    .filter(row => unpaidStatuses.includes(row[headers.indexOf('payment_status')]))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      obj._outstanding = (Number(obj.invoice_amount) || 0) - (Number(obj.paid_amount) || 0);
      obj._overdue = obj.due_date && new Date(obj.due_date) < new Date();
      return obj;
    })
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
}

// ─── 내부 헬퍼 ───────────────────────────────────────────────

function getBillingData_(billingId) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.BILLING);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('billing_id')] === billingId) {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = data[i][idx]; });
      return obj;
    }
  }
  return null;
}

function updateBillingField_(billingId, fieldName, newValue, changedBy) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.BILLING);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIdx = headers.indexOf(fieldName);

  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('billing_id')] !== billingId) continue;
    const oldValue = data[i][colIdx];
    sheet.getRange(i + 1, colIdx + 1).setValue(newValue);
    if (String(oldValue) !== String(newValue)) {
      createAuditLog('Billing', billingId, fieldName, oldValue, newValue,
        changedBy || Session.getActiveUser().getEmail(), 'Apps Script');
    }
    return;
  }
}
