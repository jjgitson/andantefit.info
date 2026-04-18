// MSO ERP - 공급업체 주문 관리 모듈

/**
 * 공급 요청 생성
 * Hospital Approved 또는 Supplier Coordination 상태에서만 허용
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

  // ID 접두사: CONFIG.ID_PREFIXES.SUPPLIER_ORDERS = 'ORD'
  const orderId = generateCustomId(CONFIG.SHEETS.SUPPLIER_ORDERS,
    CONFIG.ID_PREFIXES.SUPPLIER_ORDERS, 'supplier_order_id');
  const now = new Date();

  // Supplier_Orders 헤더 (19컬럼, acceptance_check_status만 요약 참조)
  sheet.appendRow([
    orderId,                                // supplier_order_id
    params.caseId,                          // case_id
    params.supplierId,                      // supplier_id
    now,                                    // request_date
    params.requestedItem || '',             // requested_item
    params.quantity || 1,                   // quantity
    params.expectedShipDate || '',          // expected_ship_date
    '',                                     // confirmed_ship_date
    '',                                     // delivery_date
    '',                                     // lot_batch_no
    '',                                     // coa_link
    '',                                     // shipment_tracking_no
    CONFIG.SUPPLIER_STATUS.REQUESTED,       // supplier_status
    params.storageCondition || '',          // storage_condition
    '',                                     // temp_log_link
    false,                                  // transport_incident_flag (Boolean)
    '',                                     // transport_incident_notes
    CONFIG.ACCEPTANCE_STATUS.NOT_STARTED,   // acceptance_check_status (요약)
    params.notes || '',                     // notes
  ]);

  // 케이스 상태 → Supplier Coordination
  if (caseData.case_status === CONFIG.CASE_STATUS.HOSPITAL_APPROVED) {
    changeCaseStatus(params.caseId, CONFIG.CASE_STATUS.SUPPLIER_COORDINATION,
      params.requestedBy || Session.getActiveUser().getEmail(), 'MSO Coordinator');
  }

  const supplierName = getSupplierName_(params.supplierId);

  if (params.expectedShipDate) {
    createShipmentEtaEvent(params.caseId, supplierName, new Date(params.expectedShipDate));
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
 * Supplier_Orders: supplier_status = In Transit, 출고 상세 필드 업데이트
 * @param {string} orderId
 * @param {Object} params
 */
function confirmShipment(orderId, params) {
  const order = getSupplierOrderData_(orderId);
  if (!order) throw new Error(`주문을 찾을 수 없습니다: ${orderId}`);
  if (order.supplier_status !== CONFIG.SUPPLIER_STATUS.REQUESTED &&
      order.supplier_status !== CONFIG.SUPPLIER_STATUS.CONFIRMED) {
    throw new Error(`출고 확정은 Requested 또는 Confirmed 상태에서만 가능합니다. (현재: ${order.supplier_status})`);
  }

  updateSupplierOrderField_(orderId, 'confirmed_ship_date', params.confirmedShipDate, params.updatedBy);
  updateSupplierOrderField_(orderId, 'lot_batch_no',        params.lotBatchNo,        params.updatedBy);
  updateSupplierOrderField_(orderId, 'coa_link',            params.coaLink || '',     params.updatedBy);
  updateSupplierOrderField_(orderId, 'shipment_tracking_no', params.trackingNo || '', params.updatedBy);
  updateSupplierOrderField_(orderId, 'temp_log_link',       params.tempLogLink || '', params.updatedBy);
  updateSupplierOrderField_(orderId, 'storage_condition',   params.storageCondition || '', params.updatedBy);
  updateSupplierOrderField_(orderId, 'supplier_status',     CONFIG.SUPPLIER_STATUS.IN_TRANSIT, params.updatedBy);
  updateSupplierOrderField_(orderId, 'acceptance_check_status', CONFIG.ACCEPTANCE_STATUS.PENDING, params.updatedBy);

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
 * - Acceptance_Checks 시트에 검수 레코드 생성
 * - Supplier_Orders.acceptance_check_status 업데이트 (요약)
 * - 케이스 상태 전환 (Accepted → Acceptance Confirmed, Rejected → Supplier Coordination)
 *
 * @param {string} orderId
 * @param {Object} params
 * @param {'Accepted'|'Rejected'} params.result
 * @param {string} params.checkedBy
 * @param {string} params.notes
 */
function recordAcceptanceCheck(orderId, params) {
  const order = getSupplierOrderData_(orderId);
  if (!order) throw new Error(`주문을 찾을 수 없습니다: ${orderId}`);

  // 검수는 Delivered 또는 Acceptance_Check_Pending 상태에서만 가능
  const allowedCaseStatuses = [
    CONFIG.CASE_STATUS.ACCEPTANCE_CHECK_PENDING,
    CONFIG.CASE_STATUS.SHIPMENT_IN_TRANSIT,
  ];
  const caseData = getCaseData_(order.case_id);
  if (caseData && !allowedCaseStatuses.includes(caseData.case_status)) {
    throw new Error(`입고 검수는 배송 중 또는 검수 대기 상태에서만 가능합니다. (현재: ${caseData.case_status})`);
  }

  // 1. Acceptance_Checks 시트에 검수 레코드 저장
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const accSheet = ss.getSheetByName(CONFIG.SHEETS.ACCEPTANCE_CHECKS);
  const acceptanceId = generateCustomId(CONFIG.SHEETS.ACCEPTANCE_CHECKS,
    CONFIG.ID_PREFIXES.ACCEPTANCE_CHECKS, 'acceptance_id');

  accSheet.appendRow([
    acceptanceId,
    orderId,
    order.case_id,
    new Date(),              // check_date
    params.checkedBy,        // checked_by_email
    params.result,           // result: Accepted | Rejected
    params.notes || '',      // notes
    new Date(),              // created_at
  ]);

  // 2. Supplier_Orders 요약 필드만 업데이트
  updateSupplierOrderField_(orderId, 'acceptance_check_status', params.result, params.checkedBy);
  updateSupplierOrderField_(orderId, 'supplier_status', CONFIG.SUPPLIER_STATUS.DELIVERED, params.checkedBy);

  // 3. 케이스 상태 전환
  if (params.result === CONFIG.ACCEPTANCE_STATUS.ACCEPTED) {
    changeCaseStatus(order.case_id, CONFIG.CASE_STATUS.ACCEPTANCE_CONFIRMED,
      params.checkedBy, 'Hospital User');
  } else {
    changeCaseStatus(order.case_id, CONFIG.CASE_STATUS.SUPPLIER_COORDINATION,
      params.checkedBy, 'Hospital User');
    notifyAcceptanceRejected_(order.case_id, orderId, params.notes);
  }

  addActivityLog({
    caseId: order.case_id,
    actorEmail: params.checkedBy,
    actorRole: 'Hospital User',
    actionType: 'ACCEPTANCE_CHECK_COMPLETED',
    summary: `입고 검수: ${params.result} (주문: ${orderId}, 검수ID: ${acceptanceId})`,
    nextAction: params.result === CONFIG.ACCEPTANCE_STATUS.ACCEPTED
      ? '시술 일정 확정' : '재공급 요청',
  });

  return acceptanceId;
}

/**
 * 납기 지연 주문 조회
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

// ─── 내부 헬퍼 ────────────────────────────────────────────────────

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

  if (colIdx === -1) {
    Logger.log(`updateSupplierOrderField_: 컬럼 없음 '${fieldName}' in Supplier_Orders`);
    return;
  }

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
