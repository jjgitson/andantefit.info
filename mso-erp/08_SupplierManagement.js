// MSO ERP - 공급업체 주문 관리 모듈

/**
 * 공급 요청 생성
 * Hospital Approved 상태에서만 허용 (상태 전이 규칙과 연동)
 * @param {Object} params
 * @returns {string} supplier_order_id
 */
function createSupplierOrder(params) {
  const caseData = getCaseData_(params.caseId);
  if (!caseData) throw new Error(`케이스를 찾을 수 없습니다: ${params.caseId}`);

  if (caseData.case_status !== CONFIG.CASE_STATUS.HOSPITAL_APPROVED &&
      caseData.case_status !== CONFIG.CASE_STATUS.SUPPLIER_COORDINATION) {
    throw new Error(`공급 요청은 병원 승인 이후에만 가능합니다. (현재 상태: ${caseData.case_status})`);
  }

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.SUPPLIER_ORDERS);

  const orderId = generateCustomId(CONFIG.SHEETS.SUPPLIER_ORDERS, 'SUPORD', 'supplier_order_id');
  const now = new Date();

  sheet.appendRow([
    orderId,
    params.caseId,
    params.supplierId,
    now,
    params.requestedItem || '',
    params.quantity || 1,
    params.expectedShipDate || '',
    '', // confirmed_ship_date
    '', // delivery_date
    '', // lot_batch_no
    '', // coa_link
    '', // shipment_tracking_no
    CONFIG.SUPPLIER_STATUS.REQUESTED,
    params.storageCondition || '',
    '', // temp_log_link
    'FALSE', // transport_incident_flag
    '', // transport_incident_notes
    CONFIG.ACCEPTANCE_STATUS.NOT_STARTED,
    '', // acceptance_checked_by
    '', // acceptance_checked_at
    '', // acceptance_notes
    params.notes || '',
  ]);

  // 케이스 상태 → Supplier Coordination
  if (caseData.case_status === CONFIG.CASE_STATUS.HOSPITAL_APPROVED) {
    changeCaseStatus(params.caseId, CONFIG.CASE_STATUS.SUPPLIER_COORDINATION,
      params.requestedBy || Session.getActiveUser().getEmail(), 'MSO Coordinator');
  }

  // 공급업체명 조회
  const supplierName = getSupplierName_(params.supplierId);

  // Supplier Logistics 캘린더 이벤트
  if (params.expectedShipDate) {
    const eventId = createShipmentEtaEvent(params.caseId, supplierName, new Date(params.expectedShipDate));
    // 이벤트 ID는 Appointments에 저장하거나 Order 행에 저장 가능
  }

  addActivityLog({
    caseId: params.caseId,
    actorEmail: params.requestedBy,
    actorRole: 'MSO Coordinator',
    actionType: 'SUPPLIER_ORDER_CREATED',
    summary: `공급 요청 생성: ${orderId} → ${supplierName}`,
    nextAction: '공급업체 확정 대기',
  });

  return orderId;
}

/**
 * 공급업체 출고 확정 입력
 * @param {string} orderId
 * @param {Object} params
 * @param {Date} params.confirmedShipDate
 * @param {string} params.lotBatchNo
 * @param {string} params.coaLink
 * @param {string} params.trackingNo
 * @param {string} params.updatedBy
 */
function confirmShipment(orderId, params) {
  const order = getSupplierOrderData_(orderId);
  if (!order) throw new Error(`주문을 찾을 수 없습니다: ${orderId}`);

  updateSupplierOrderField_(orderId, 'confirmed_ship_date', params.confirmedShipDate, params.updatedBy);
  updateSupplierOrderField_(orderId, 'lot_batch_no', params.lotBatchNo, params.updatedBy);
  updateSupplierOrderField_(orderId, 'coa_link', params.coaLink, params.updatedBy);
  updateSupplierOrderField_(orderId, 'shipment_tracking_no', params.trackingNo, params.updatedBy);
  updateSupplierOrderField_(orderId, 'supplier_status', CONFIG.SUPPLIER_STATUS.IN_TRANSIT, params.updatedBy);

  changeCaseStatus(order.case_id, CONFIG.CASE_STATUS.SHIPMENT_IN_TRANSIT,
    params.updatedBy, 'Supplier User');

  addActivityLog({
    caseId: order.case_id,
    actorEmail: params.updatedBy,
    actorRole: 'Supplier User',
    actionType: 'SHIPMENT_CONFIRMED',
    summary: `출고 확정: ${orderId}, 배치번호: ${params.lotBatchNo}, 트래킹: ${params.trackingNo}`,
  });
}

/**
 * 입고 검수 결과 입력
 * @param {string} orderId
 * @param {Object} params
 * @param {'Accepted'|'Rejected'} params.result
 * @param {string} params.checkedBy
 * @param {string} params.notes
 */
function recordAcceptanceCheck(orderId, params) {
  const order = getSupplierOrderData_(orderId);
  if (!order) throw new Error(`주문을 찾을 수 없습니다: ${orderId}`);

  updateSupplierOrderField_(orderId, 'acceptance_check_status', params.result, params.checkedBy);
  updateSupplierOrderField_(orderId, 'acceptance_checked_by', params.checkedBy, params.checkedBy);
  updateSupplierOrderField_(orderId, 'acceptance_checked_at', new Date(), params.checkedBy);
  updateSupplierOrderField_(orderId, 'acceptance_notes', params.notes || '', params.checkedBy);
  updateSupplierOrderField_(orderId, 'supplier_status', CONFIG.SUPPLIER_STATUS.DELIVERED, params.checkedBy);

  if (params.result === CONFIG.ACCEPTANCE_STATUS.ACCEPTED) {
    changeCaseStatus(order.case_id, CONFIG.CASE_STATUS.ACCEPTANCE_CONFIRMED,
      params.checkedBy, 'Hospital User');
  } else {
    // 반려 시 Supplier Coordination으로 복귀
    changeCaseStatus(order.case_id, CONFIG.CASE_STATUS.SUPPLIER_COORDINATION,
      params.checkedBy, 'Hospital User');
    notifyAcceptanceRejected_(order.case_id, orderId, params.notes);
  }

  addActivityLog({
    caseId: order.case_id,
    actorEmail: params.checkedBy,
    actorRole: 'Hospital User',
    actionType: 'ACCEPTANCE_CHECK_COMPLETED',
    summary: `입고 검수: ${params.result} (${orderId})`,
    nextAction: params.result === 'Accepted' ? '시술 일정 확정' : '재공급 요청',
  });
}

/**
 * 납기 지연 케이스 조회
 * @returns {Array<Object>}
 */
function getDelayedSupplierOrders() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.SUPPLIER_ORDERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const today = new Date();

  return data.slice(1)
    .filter(row => {
      const status = row[headers.indexOf('supplier_status')];
      const expectedDate = row[headers.indexOf('expected_ship_date')];
      if (!expectedDate) return false;
      const isActive = [CONFIG.SUPPLIER_STATUS.REQUESTED, CONFIG.SUPPLIER_STATUS.CONFIRMED].includes(status);
      return isActive && new Date(expectedDate) < today;
    })
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
}

// ─── 내부 헬퍼 ───────────────────────────────────────────────

function getSupplierOrderData_(orderId) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.SUPPLIER_ORDERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('supplier_order_id')] === orderId) {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = data[i][idx]; });
      return obj;
    }
  }
  return null;
}

function updateSupplierOrderField_(orderId, fieldName, newValue, changedBy) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.SUPPLIER_ORDERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIdx = headers.indexOf(fieldName);

  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('supplier_order_id')] !== orderId) continue;
    const oldValue = data[i][colIdx];
    sheet.getRange(i + 1, colIdx + 1).setValue(newValue);
    if (String(oldValue) !== String(newValue)) {
      createAuditLog('Supplier_Orders', orderId, fieldName, oldValue, newValue,
        changedBy || Session.getActiveUser().getEmail(), 'Apps Script');
    }
    return;
  }
}

function getSupplierName_(supplierId) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.SUPPLIERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('supplier_id')] === supplierId) {
      return data[i][headers.indexOf('supplier_name')];
    }
  }
  return supplierId;
}

function notifyAcceptanceRejected_(caseId, orderId, notes) {
  const caseData = getCaseData_(caseId);
  if (!caseData || !caseData.assigned_coordinator) return;
  sendEmail_(
    caseData.assigned_coordinator,
    `[MSO-ERP] 입고 검수 반려 - ${caseId}`,
    `케이스 ${caseId}의 주문 ${orderId}이 입고 검수에서 반려되었습니다.\n\n사유: ${notes || '미기재'}\n\n재공급 요청을 진행해 주세요.`
  );
}
