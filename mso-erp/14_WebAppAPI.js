// MSO ERP - API 함수 전수 구현
// 13_WebApp.js의 dispatchAction_에서 호출됨

// ════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════

/**
 * 대시보드 KPI 데이터 반환
 */
function getDashboardData(user, role, profile) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const today = new Date();

  const cases    = sheetToObjects_(ss, CONFIG.SHEETS.CASES);
  const leads    = sheetToObjects_(ss, CONFIG.SHEETS.LEADS);
  const followups= sheetToObjects_(ss, CONFIG.SHEETS.FOLLOWUPS);
  const billing  = sheetToObjects_(ss, CONFIG.SHEETS.BILLING);
  const orders   = sheetToObjects_(ss, CONFIG.SHEETS.SUPPLIER_ORDERS);

  const myCases = filterCasesByRole_(cases, user, role, profile);

  return {
    // 운영 KPI
    newLeads: leads.filter(l => l.lead_status === CONFIG.LEAD_STATUS.NEW).length,
    underReview: myCases.filter(c => c.case_status === CONFIG.CASE_STATUS.UNDER_HOSPITAL_REVIEW).length,
    upcomingTreatments: myCases
      .filter(c => c.treatment_date && new Date(c.treatment_date) >= today &&
        c.case_status === CONFIG.CASE_STATUS.SCHEDULED)
      .sort((a,b) => new Date(a.treatment_date) - new Date(b.treatment_date))
      .slice(0, 5),
    overdueFollowups: followups
      .filter(f => f.due_date && !f.completed_date && new Date(f.due_date) < today)
      .length,
    // 재무 KPI
    outstandingAmount: billing
      .filter(b => [CONFIG.PAYMENT_STATUS.INVOICE_SENT, CONFIG.PAYMENT_STATUS.PARTIALLY_PAID]
        .includes(b.payment_status))
      .reduce((s, b) => s + (Number(b.invoice_amount||0) - Number(b.paid_amount||0)), 0),
    // 공급 KPI
    delayedOrders: orders.filter(o =>
      [CONFIG.SUPPLIER_STATUS.REQUESTED, CONFIG.SUPPLIER_STATUS.CONFIRMED].includes(o.supplier_status) &&
      o.expected_ship_date && new Date(o.expected_ship_date) < today).length,
    pendingAcceptance: orders.filter(o =>
      o.supplier_status === CONFIG.SUPPLIER_STATUS.DELIVERED &&
      o.acceptance_check_status !== CONFIG.ACCEPTANCE_STATUS.ACCEPTED).length,
    // 케이스 상태별 카운트
    casesByStatus: myCases.reduce((acc, c) => {
      acc[c.case_status] = (acc[c.case_status] || 0) + 1;
      return acc;
    }, {}),
  };
}

// ════════════════════════════════════════════════════════════
// LEADS
// ════════════════════════════════════════════════════════════

function getLeads(data, user, role, profile) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let leads = sheetToObjects_(ss, CONFIG.SHEETS.LEADS);

  if (role === ROLES.MSO_COORDINATOR) {
    leads = leads.filter(l => l.assigned_coordinator === user);
  }
  if (data.status) leads = leads.filter(l => l.lead_status === data.status);
  if (data.search) {
    const q = data.search.toLowerCase();
    leads = leads.filter(l =>
      (l.patient_name||'').toLowerCase().includes(q) ||
      (l.email||'').toLowerCase().includes(q) ||
      (l.lead_id||'').toLowerCase().includes(q)
    );
  }

  return { leads: leads.reverse(), total: leads.length };
}

function createLead(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR].includes(role)) throw new Error('권한 없음');

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.LEADS);
  const leadId = generateCustomId(CONFIG.SHEETS.LEADS, 'LEAD', 'lead_id');
  const now = new Date();

  sheet.appendRow([
    leadId,
    data.inquiry_date ? new Date(data.inquiry_date) : now,
    data.source_channel || '',
    data.patient_name || '',
    data.country || '',
    data.phone || '',
    data.email || '',
    data.chief_interest || '',
    data.assigned_coordinator || user,
    CONFIG.LEAD_STATUS.NEW,
    '', '',
    data.notes || '',
    now,
  ]);

  addActivityLog({
    caseId: '', actorEmail: user, actorRole: role,
    actionType: 'LEAD_CREATED',
    summary: `리드 생성: ${leadId} (${data.patient_name})`,
  });

  return { success: true, leadId };
}

function updateLead(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR].includes(role)) throw new Error('권한 없음');

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.LEADS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][headers.indexOf('lead_id')] !== data.lead_id) continue;

    // Coordinator는 본인 담당 리드만 수정
    if (role === ROLES.MSO_COORDINATOR &&
        rows[i][headers.indexOf('assigned_coordinator')] !== user) {
      throw new Error('본인 담당 리드만 수정할 수 있습니다');
    }

    ['lead_status','assigned_coordinator','notes','source_channel'].forEach(field => {
      if (data[field] !== undefined) {
        const col = headers.indexOf(field);
        if (col !== -1) {
          createAuditLog('Leads', data.lead_id, field, rows[i][col], data[field], user, 'WebApp');
          sheet.getRange(i + 1, col + 1).setValue(data[field]);
        }
      }
    });

    addActivityLog({ caseId: '', actorEmail: user, actorRole: role,
      actionType: 'LEAD_UPDATED', summary: `리드 수정: ${data.lead_id} → 상태: ${data.lead_status||'변경없음'}` });

    return { success: true };
  }
  throw new Error(`리드를 찾을 수 없습니다: ${data.lead_id}`);
}

// ════════════════════════════════════════════════════════════
// PATIENTS
// ════════════════════════════════════════════════════════════

function getPatient(patientId, user, role) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const patients = sheetToObjects_(ss, CONFIG.SHEETS.PATIENTS);
  const patient = patients.find(p => p.patient_id === patientId);
  if (!patient) throw new Error('환자를 찾을 수 없습니다');

  // Supplier는 환자 정보 접근 불가
  if (role === ROLES.SUPPLIER_USER) throw new Error('권한 없음');

  // Hospital User는 의료 관련 필드만
  if (role === ROLES.HOSPITAL_USER) {
    return {
      patient: {
        patient_id: patient.patient_id,
        patient_code: patient.patient_code,
        date_of_birth: patient.date_of_birth,
        sex: patient.sex,
        nationality: patient.nationality,
        preferred_language: patient.preferred_language,
      }
    };
  }

  return { patient };
}

function createPatient(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR].includes(role)) throw new Error('권한 없음');

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PATIENTS);
  const patientId = generateCustomId(CONFIG.SHEETS.PATIENTS, 'PAT', 'patient_id');
  const patientCode = generatePatientCode();
  const now = new Date();

  sheet.appendRow([
    patientId, patientCode,
    data.full_name || '',
    data.english_name || '',
    data.date_of_birth ? new Date(data.date_of_birth) : '',
    data.sex || '',
    data.nationality || '',
    data.passport_no || '',
    data.phone || '',
    data.email || '',
    data.preferred_language || '',
    data.guardian_name || '',
    data.guardian_contact || '',
    data.consent_privacy  === true || data.consent_privacy  === 'true',   // Boolean
    data.consent_data_transfer === true || data.consent_data_transfer === 'true', // Boolean
    now,
    user,
  ]);

  createAuditLog('Patients', patientId, 'created', '', patientId, user, 'WebApp');
  return { success: true, patientId, patientCode };
}

// ════════════════════════════════════════════════════════════
// CASES
// ════════════════════════════════════════════════════════════

function getCases(data, user, role, profile) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let cases = sheetToObjects_(ss, CONFIG.SHEETS.CASES);
  cases = filterCasesByRole_(cases, user, role, profile);

  if (data.status) cases = cases.filter(c => c.case_status === data.status);
  if (data.search) {
    const q = data.search.toLowerCase();
    cases = cases.filter(c =>
      (c.case_id||'').toLowerCase().includes(q) ||
      (c.hospital_id||'').toLowerCase().includes(q) ||
      (c.target_indication||'').toLowerCase().includes(q)
    );
  }

  return { cases: cases.reverse(), total: cases.length };
}

function createCase_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR].includes(role)) throw new Error('권한 없음');
  const caseId = createCase({
    patientId: data.patient_id,
    leadId: data.lead_id || '',
    hospitalId: data.hospital_id,
    supplierId: data.supplier_id || '',
    targetIndication: data.target_indication,
    assignedCoordinator: data.assigned_coordinator || user,
    priority: data.priority || 'Normal',
    remarks: data.remarks || '',
  });
  return { success: true, caseId };
}

/**
 * 케이스 상태 변경 (검증 포함)
 */
function updateCaseStatus(caseId, targetStatus, user, role) {
  // 검증 후 변경 (03_StateTransition.js)
  changeCaseStatus(caseId, targetStatus, user, role);
  return { success: true, caseId, newStatus: targetStatus };
}

/**
 * 케이스 전체 상세 데이터 반환
 */
function getCaseDetail(caseId, user, role, profile) {
  if (!caseId) throw new Error('caseId가 필요합니다');

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const caseData = getCaseData_(caseId);
  if (!caseData) throw new Error(`케이스를 찾을 수 없습니다: ${caseId}`);

  // 접근 권한 검증
  if (role === ROLES.MSO_COORDINATOR && caseData.assigned_coordinator !== user) {
    throw new Error('본인 담당 케이스만 조회할 수 있습니다');
  }
  if (role === ROLES.HOSPITAL_USER && caseData.hospital_id !== profile.hospital_id) {
    throw new Error('본인 병원 케이스만 조회할 수 있습니다');
  }

  const reviews     = sheetToObjects_(ss, CONFIG.SHEETS.MEDICAL_REVIEWS).filter(r => r.case_id === caseId);
  const orders      = sheetToObjects_(ss, CONFIG.SHEETS.SUPPLIER_ORDERS).filter(o => o.case_id === caseId);
  const docs        = sheetToObjects_(ss, CONFIG.SHEETS.DOCUMENTS).filter(d => d.case_id === caseId && d.is_latest === 'Yes');
  const billing_    = sheetToObjects_(ss, CONFIG.SHEETS.BILLING).filter(b => b.case_id === caseId);
  const followups   = sheetToObjects_(ss, CONFIG.SHEETS.FOLLOWUPS).filter(f => f.case_id === caseId);
  const activities  = sheetToObjects_(ss, CONFIG.SHEETS.ACTIVITY_LOG).filter(a => a.case_id === caseId).slice(-30).reverse();
  const appointments= sheetToObjects_(ss, CONFIG.SHEETS.APPOINTMENTS).filter(a => a.case_id === caseId);

  // Supplier는 환자 정보 미제공
  let patient = null;
  if (role !== ROLES.SUPPLIER_USER && caseData.patient_id) {
    const { patient: p } = getPatient(caseData.patient_id, user, role);
    patient = p;
  }

  // Supplier는 자기 주문만
  const filteredOrders = role === ROLES.SUPPLIER_USER
    ? orders.filter(o => o.supplier_id === profile.supplier_id)
    : orders;

  return {
    case: caseData, patient,
    reviews, orders: filteredOrders, docs,
    billing: billing_, followups, activities, appointments,
  };
}

// ════════════════════════════════════════════════════════════
// HOSPITAL REVIEW
// ════════════════════════════════════════════════════════════

function getReview(caseId) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const reviews = sheetToObjects_(ss, CONFIG.SHEETS.MEDICAL_REVIEWS).filter(r => r.case_id === caseId);
  return { reviews };
}

function submitHospitalReview(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.HOSPITAL_USER].includes(role)) throw new Error('권한 없음');
  if (!data.review_result) throw new Error('review_result 필드가 필요합니다');

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MEDICAL_REVIEWS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const now = new Date();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][headers.indexOf('case_id')] !== data.case_id) continue;

    const updatable = {
      review_status: CONFIG.REVIEW_STATUS.COMPLETED,   // 심사 완료 표시
      review_result: data.review_result,
      next_medical_step: data.next_medical_step || '',
      consultation_date: data.consultation_date ? new Date(data.consultation_date) : '',
      additional_test_required: data.additional_test_required || '',
      medical_notes_link: data.medical_notes_link || '',
      notes: data.notes || '',
      review_completed_date: now,
      hospital_user: user,
    };

    Object.entries(updatable).forEach(([field, val]) => {
      const col = headers.indexOf(field);
      if (col !== -1) sheet.getRange(i + 1, col + 1).setValue(val);
    });

    // 승인 → 케이스 상태 변경
    if (data.review_result === CONFIG.REVIEW_RESULT.SUITABLE) {
      updateCaseField_(data.case_id, 'hospital_decision_at', now, user);
      changeCaseStatus(data.case_id, CONFIG.CASE_STATUS.HOSPITAL_APPROVED, user, role);
    } else if (data.review_result === CONFIG.REVIEW_RESULT.NOT_SUITABLE) {
      changeCaseStatus(data.case_id, CONFIG.CASE_STATUS.CANCELLED, user, role);
    }

    addActivityLog({
      caseId: data.case_id, actorEmail: user, actorRole: role,
      actionType: 'HOSPITAL_REVIEW_SUBMITTED',
      summary: `병원 검토 결과 제출: ${data.review_result}`,
    });

    return { success: true };
  }
  throw new Error('해당 케이스의 검토 요청을 찾을 수 없습니다');
}

// ════════════════════════════════════════════════════════════
// SUPPLIER ORDERS
// ════════════════════════════════════════════════════════════

function getSupplierOrders(data, user, role, profile) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let orders = sheetToObjects_(ss, CONFIG.SHEETS.SUPPLIER_ORDERS);

  if (role === ROLES.SUPPLIER_USER) {
    orders = orders.filter(o => o.supplier_id === profile.supplier_id);
  } else if (role === ROLES.MSO_COORDINATOR) {
    const myCaseIds = sheetToObjects_(ss, CONFIG.SHEETS.CASES)
      .filter(c => c.assigned_coordinator === user).map(c => c.case_id);
    orders = orders.filter(o => myCaseIds.includes(o.case_id));
  }

  if (data.caseId) orders = orders.filter(o => o.case_id === data.caseId);
  if (data.status) orders = orders.filter(o => o.supplier_status === data.status);

  return { orders };
}

function createSupplierOrder_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR].includes(role)) throw new Error('권한 없음');
  const orderId = createSupplierOrder({ ...data, requestedBy: user });
  return { success: true, orderId };
}

function confirmShipment_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.SUPPLIER_USER].includes(role)) throw new Error('권한 없음');
  confirmShipment(data.orderId, { ...data, updatedBy: user });
  return { success: true };
}

function recordAcceptanceCheck_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.HOSPITAL_USER].includes(role)) throw new Error('권한 없음');
  if (!data.result) throw new Error('검수 결과(result) 필드가 필요합니다');
  recordAcceptanceCheck(data.orderId, { result: data.result, notes: data.notes, checkedBy: user });
  return { success: true };
}

// ════════════════════════════════════════════════════════════
// BILLING
// ════════════════════════════════════════════════════════════

function getBilling(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR, ROLES.FINANCE_USER].includes(role)) throw new Error('권한 없음');
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let rows = sheetToObjects_(ss, CONFIG.SHEETS.BILLING);
  if (data.caseId) rows = rows.filter(b => b.case_id === data.caseId);
  if (data.onlyOutstanding) {
    rows = rows.filter(b => [CONFIG.PAYMENT_STATUS.INVOICE_SENT, CONFIG.PAYMENT_STATUS.PARTIALLY_PAID].includes(b.payment_status));
  }
  return { billing: rows };
}

/**
 * 청구 생성 또는 업데이트 (단일 엔드포인트)
 */
function saveBilling(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.FINANCE_USER, ROLES.MSO_COORDINATOR].includes(role)) throw new Error('권한 없음');

  if (data.billing_id) {
    // 기존 레코드 필드 업데이트
    const updatable = ['quote_no','invoice_no','currency','quote_amount','invoice_amount',
      'paid_amount','payment_status','due_date','paid_date','refund_amount','notes'];
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.BILLING);
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][headers.indexOf('billing_id')] !== data.billing_id) continue;
      updatable.forEach(field => {
        if (data[field] !== undefined) {
          createAuditLog('Billing', data.billing_id, field, rows[i][headers.indexOf(field)], data[field], user, 'WebApp');
          sheet.getRange(i + 1, headers.indexOf(field) + 1).setValue(data[field]);
        }
      });
      return { success: true, billing_id: data.billing_id };
    }
    throw new Error('청구 레코드를 찾을 수 없습니다');
  }

  // 신규 생성
  const billingId = createBillingRecord({ ...data, createdBy: user });
  return { success: true, billing_id: billingId };
}

function issueQuote_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.FINANCE_USER].includes(role)) throw new Error('권한 없음');
  issueQuote(data.billingId, { ...data, issuedBy: user });
  return { success: true };
}

function issueInvoice_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.FINANCE_USER].includes(role)) throw new Error('권한 없음');
  issueInvoice(data.billingId, { ...data, issuedBy: user });
  return { success: true };
}

function recordPayment_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.FINANCE_USER].includes(role)) throw new Error('권한 없음');
  recordPayment(data.billingId, { paidAmount: data.paidAmount, paidDate: data.paidDate, processedBy: user });
  return { success: true };
}

// ════════════════════════════════════════════════════════════
// FOLLOWUPS
// ════════════════════════════════════════════════════════════

function getFollowups(data, user, role, profile) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let rows = sheetToObjects_(ss, CONFIG.SHEETS.FOLLOWUPS);

  if (role === ROLES.MSO_COORDINATOR) {
    rows = rows.filter(f => f.responsible_party === user);
  }
  if (data.caseId) rows = rows.filter(f => f.case_id === data.caseId);
  if (data.onlyPending) rows = rows.filter(f => !f.completed_date);

  return { followups: rows };
}

function completeFollowup_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR].includes(role)) throw new Error('권한 없음');
  completeFollowup(data.followupId, {
    patientResponse: data.patientResponse,
    notes: data.notes,
    escalationRequired: data.escalationRequired,
    completedBy: user,
  });
  return { success: true };
}

// ════════════════════════════════════════════════════════════
// DOCUMENTS
// ════════════════════════════════════════════════════════════

function registerDocument_api(data, user, role) {
  const docId = registerDocument({ ...data, uploadedBy: user });
  return { success: true, documentId: docId };
}

function getDocuments(caseId, user, role) {
  return { documents: getLatestDocuments(caseId) };
}

// ════════════════════════════════════════════════════════════
// APPOINTMENTS
// ════════════════════════════════════════════════════════════

function getAppointments(data, user, role) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let apts = sheetToObjects_(ss, CONFIG.SHEETS.APPOINTMENTS);
  if (data.caseId) apts = apts.filter(a => a.case_id === data.caseId);
  return { appointments: apts };
}

function createAppointment_api(data, user, role) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.APPOINTMENTS);
  const aptId = generateCustomId(CONFIG.SHEETS.APPOINTMENTS, 'APT', 'appointment_id');

  let eventId = '';
  try {
    eventId = createCalendarEvent(
      CONFIG.CALENDAR_TYPES.HOSPITAL_COORD,
      `[${data.appointment_type}] ${data.case_id}`,
      new Date(data.scheduled_date),
      `케이스: ${data.case_id}\n유형: ${data.appointment_type}\n장소: ${data.location||'-'}`
    ) || '';
  } catch (e) { Logger.log('캘린더 이벤트 생성 실패: ' + e.message); }

  sheet.appendRow([
    aptId, data.case_id, data.appointment_type,
    data.scheduled_date ? new Date(data.scheduled_date) : '',
    data.scheduled_time || '',   // scheduled_time
    data.location || '',
    data.responsible_party || user,
    data.attendee_status || 'Pending',
    false, eventId, data.notes || '',
  ]);

  return { success: true, appointmentId: aptId };
}

// ════════════════════════════════════════════════════════════
// 공통 유틸
// ════════════════════════════════════════════════════════════

/**
 * 시트를 객체 배열로 변환
 */
function sheetToObjects_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        const val = row[i];
        obj[h] = val instanceof Date ? val.toISOString() : val;
      });
      return obj;
    });
}
