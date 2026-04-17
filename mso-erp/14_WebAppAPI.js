// MSO ERP - 웹앱 API 핸들러
// 모든 함수는 13_WebApp.js의 dispatchAction_에서 호출됨

// ─── Dashboard ────────────────────────────────────────────────

function apiGetDashboardSummary(user, role) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  const cases = sheetToObjects_(ss, CONFIG.SHEETS.CASES);
  const leads = sheetToObjects_(ss, CONFIG.SHEETS.LEADS);
  const followups = sheetToObjects_(ss, CONFIG.SHEETS.FOLLOWUPS);
  const billing = sheetToObjects_(ss, CONFIG.SHEETS.BILLING);
  const orders = sheetToObjects_(ss, CONFIG.SHEETS.SUPPLIER_ORDERS);

  const filteredCases = filterCasesByRole_(cases, user, role);
  const today = new Date();

  return {
    newLeads: leads.filter(l => l.lead_status === CONFIG.LEAD_STATUS.NEW).length,
    underReview: filteredCases.filter(c => c.case_status === CONFIG.CASE_STATUS.UNDER_HOSPITAL_REVIEW).length,
    upcomingTreatments: filteredCases
      .filter(c => c.treatment_date && new Date(c.treatment_date) >= today &&
        c.case_status === CONFIG.CASE_STATUS.SCHEDULED)
      .slice(0, 5)
      .map(c => ({ caseId: c.case_id, date: c.treatment_date, hospital: c.hospital_id })),
    overdueFollowups: followups.filter(f => f.due_date && !f.completed_date &&
      new Date(f.due_date) < today).length,
    outstandingAmount: billing
      .filter(b => [CONFIG.PAYMENT_STATUS.INVOICE_SENT, CONFIG.PAYMENT_STATUS.PARTIALLY_PAID].includes(b.payment_status))
      .reduce((sum, b) => sum + (Number(b.invoice_amount) - Number(b.paid_amount || 0)), 0),
    delayedOrders: orders.filter(o =>
      [CONFIG.SUPPLIER_STATUS.REQUESTED, CONFIG.SUPPLIER_STATUS.CONFIRMED].includes(o.supplier_status) &&
      o.expected_ship_date && new Date(o.expected_ship_date) < today
    ).length,
    pendingAcceptance: orders.filter(o =>
      o.acceptance_check_status === CONFIG.ACCEPTANCE_STATUS.PENDING ||
      o.supplier_status === CONFIG.SUPPLIER_STATUS.DELIVERED
    ).length,
  };
}

// ─── Leads ────────────────────────────────────────────────────

function apiGetLeads(data, user, role) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let leads = sheetToObjects_(ss, CONFIG.SHEETS.LEADS);

  if (role === 'MSO Coordinator') {
    leads = leads.filter(l => l.assigned_coordinator === user);
  }

  // 상태 필터
  if (data && data.status) {
    leads = leads.filter(l => l.lead_status === data.status);
  }

  return { leads: leads.reverse() }; // 최신순
}

function apiCreateLead(data, user, role) {
  if (!['MSO Admin', 'MSO Coordinator'].includes(role)) throw new Error('권한 없음');

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.LEADS);
  const leadId = generateCustomId(CONFIG.SHEETS.LEADS, 'LEAD', 'lead_id');
  const now = new Date();

  sheet.appendRow([
    leadId,
    data.inquiry_date || now,
    data.source_channel || '',
    data.patient_name || '',
    data.country || '',
    data.phone || '',
    data.email || '',
    data.chief_interest || '',
    data.assigned_coordinator || user,
    CONFIG.LEAD_STATUS.NEW,
    '', '', // patient_id, converted_to_case_id
    data.notes || '',
    now,
  ]);

  addActivityLog({ caseId: '', actorEmail: user, actorRole: role,
    actionType: 'LEAD_CREATED', summary: `리드 생성: ${leadId} (${data.patient_name})` });

  return { success: true, leadId };
}

function apiUpdateLead(data, user, role) {
  if (!['MSO Admin', 'MSO Coordinator'].includes(role)) throw new Error('권한 없음');

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.LEADS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][headers.indexOf('lead_id')] !== data.lead_id) continue;

    const updatable = ['lead_status', 'assigned_coordinator', 'notes', 'source_channel'];
    updatable.forEach(field => {
      if (data[field] !== undefined) {
        const col = headers.indexOf(field);
        if (col !== -1) {
          createAuditLog('Leads', data.lead_id, field, rows[i][col], data[field], user, 'WebApp');
          sheet.getRange(i + 1, col + 1).setValue(data[field]);
        }
      }
    });
    return { success: true };
  }
  throw new Error('리드를 찾을 수 없습니다');
}

// ─── Cases ────────────────────────────────────────────────────

function apiGetCases(data, user, role) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let cases = sheetToObjects_(ss, CONFIG.SHEETS.CASES);
  cases = filterCasesByRole_(cases, user, role);

  if (data && data.status) {
    cases = cases.filter(c => c.case_status === data.status);
  }

  return { cases: cases.reverse() };
}

function apiGetCase(caseId, user, role) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  const caseData = getCaseData_(caseId);
  if (!caseData) throw new Error('케이스를 찾을 수 없습니다');

  // 접근 권한 검증
  if (role === 'MSO Coordinator' && caseData.assigned_coordinator !== user) throw new Error('권한 없음');
  if (role === 'Hospital User' && caseData.hospital_id !== getUserHospitalId_(user)) throw new Error('권한 없음');

  const reviews = sheetToObjects_(ss, CONFIG.SHEETS.MEDICAL_REVIEW)
    .filter(r => r.case_id === caseId);
  const orders = sheetToObjects_(ss, CONFIG.SHEETS.SUPPLIER_ORDERS)
    .filter(o => o.case_id === caseId);
  const docs = sheetToObjects_(ss, CONFIG.SHEETS.DOCUMENTS)
    .filter(d => d.case_id === caseId && d.is_latest === 'Yes');
  const billing = sheetToObjects_(ss, CONFIG.SHEETS.BILLING)
    .filter(b => b.case_id === caseId);
  const followups = sheetToObjects_(ss, CONFIG.SHEETS.FOLLOWUPS)
    .filter(f => f.case_id === caseId);
  const activities = sheetToObjects_(ss, CONFIG.SHEETS.ACTIVITY_LOG)
    .filter(a => a.case_id === caseId).slice(-20).reverse();
  const appointments = sheetToObjects_(ss, CONFIG.SHEETS.APPOINTMENTS)
    .filter(a => a.case_id === caseId);

  // 환자 정보 (Supplier는 최소 노출)
  let patient = null;
  if (role !== 'Supplier User') {
    const patients = sheetToObjects_(ss, CONFIG.SHEETS.PATIENTS);
    patient = patients.find(p => p.patient_id === caseData.patient_id);
    if (patient && role === 'Hospital User') {
      // 병원에는 의료 관련 필드만 노출
      patient = { patient_id: patient.patient_id, patient_code: patient.patient_code,
        date_of_birth: patient.date_of_birth, sex: patient.sex,
        nationality: patient.nationality, preferred_language: patient.preferred_language };
    }
  }

  return { case: caseData, patient, reviews, orders, docs, billing, followups, activities, appointments };
}

function apiCreateCase(data, user, role) {
  if (!['MSO Admin', 'MSO Coordinator'].includes(role)) throw new Error('권한 없음');
  const caseId = createCase({ ...data, assignedCoordinator: data.assigned_coordinator || user });
  return { success: true, caseId };
}

function apiChangeCaseStatus(data, user, role) {
  changeCaseStatus(data.caseId, data.targetStatus, user, role);
  return { success: true };
}

// ─── Hospital Review ──────────────────────────────────────────

function apiSubmitHospitalReview(data, user, role) {
  if (!['MSO Admin', 'Hospital User'].includes(role)) throw new Error('권한 없음');

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MEDICAL_REVIEW);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  // 기존 review 행 찾아 업데이트
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][headers.indexOf('case_id')] !== data.case_id) continue;

    const updatable = ['review_result', 'next_medical_step', 'consultation_date',
      'additional_test_required', 'medical_notes_link', 'notes'];
    updatable.forEach(field => {
      if (data[field] !== undefined) {
        sheet.getRange(i + 1, headers.indexOf(field) + 1).setValue(data[field]);
      }
    });
    sheet.getRange(i + 1, headers.indexOf('review_completed_date') + 1).setValue(new Date());
    sheet.getRange(i + 1, headers.indexOf('hospital_user') + 1).setValue(user);

    // 승인 시 케이스 상태 변경
    if (data.review_result === CONFIG.REVIEW_RESULT.SUITABLE) {
      changeCaseStatus(data.case_id, CONFIG.CASE_STATUS.HOSPITAL_APPROVED, user, role);
    }

    addActivityLog({ caseId: data.case_id, actorEmail: user, actorRole: role,
      actionType: 'REVIEW_SUBMITTED', summary: `병원 검토 결과: ${data.review_result}` });

    return { success: true };
  }
  throw new Error('검토 요청을 찾을 수 없습니다');
}

function apiGetReview(caseId, user, role) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const reviews = sheetToObjects_(ss, CONFIG.SHEETS.MEDICAL_REVIEW)
    .filter(r => r.case_id === caseId);
  return { reviews };
}

// ─── Supplier Orders ──────────────────────────────────────────

function apiCreateSupplierOrder(data, user, role) {
  if (!['MSO Admin', 'MSO Coordinator'].includes(role)) throw new Error('권한 없음');
  const orderId = createSupplierOrder({ ...data, requestedBy: user });
  return { success: true, orderId };
}

function apiGetSupplierOrders(data, user, role) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let orders = sheetToObjects_(ss, CONFIG.SHEETS.SUPPLIER_ORDERS);

  if (role === 'Supplier User') {
    const supplierId = getUserSupplierId_(user);
    orders = orders.filter(o => o.supplier_id === supplierId);
  } else if (role === 'MSO Coordinator') {
    const cases = sheetToObjects_(ss, CONFIG.SHEETS.CASES)
      .filter(c => c.assigned_coordinator === user)
      .map(c => c.case_id);
    orders = orders.filter(o => cases.includes(o.case_id));
  }

  if (data && data.caseId) orders = orders.filter(o => o.case_id === data.caseId);

  return { orders };
}

function apiConfirmShipment(data, user, role) {
  if (!['MSO Admin', 'Supplier User'].includes(role)) throw new Error('권한 없음');
  confirmShipment(data.orderId, { ...data, updatedBy: user });
  return { success: true };
}

function apiRecordAcceptance(data, user, role) {
  if (!['MSO Admin', 'Hospital User'].includes(role)) throw new Error('권한 없음');
  recordAcceptanceCheck(data.orderId, { ...data, checkedBy: user });
  return { success: true };
}

// ─── Billing ──────────────────────────────────────────────────

function apiGetBilling(data, user, role) {
  if (!['MSO Admin', 'MSO Coordinator', 'Finance User'].includes(role)) throw new Error('권한 없음');
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let billing = sheetToObjects_(ss, CONFIG.SHEETS.BILLING);
  if (data && data.caseId) billing = billing.filter(b => b.case_id === data.caseId);
  return { billing };
}

function apiCreateBilling(data, user, role) {
  if (!['MSO Admin', 'Finance User'].includes(role)) throw new Error('권한 없음');
  const billingId = createBillingRecord({ ...data, createdBy: user });
  return { success: true, billingId };
}

function apiIssueQuote(data, user, role) {
  if (!['MSO Admin', 'Finance User'].includes(role)) throw new Error('권한 없음');
  issueQuote(data.billingId, { ...data, issuedBy: user });
  return { success: true };
}

function apiIssueInvoice(data, user, role) {
  if (!['MSO Admin', 'Finance User'].includes(role)) throw new Error('권한 없음');
  issueInvoice(data.billingId, { ...data, issuedBy: user });
  return { success: true };
}

function apiRecordPayment(data, user, role) {
  if (!['MSO Admin', 'Finance User'].includes(role)) throw new Error('권한 없음');
  recordPayment(data.billingId, { ...data, processedBy: user });
  return { success: true };
}

// ─── Followups ────────────────────────────────────────────────

function apiGetFollowups(data, user, role) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let followups = sheetToObjects_(ss, CONFIG.SHEETS.FOLLOWUPS);

  if (role === 'MSO Coordinator') {
    followups = followups.filter(f => f.responsible_party === user);
  }
  if (data && data.caseId) followups = followups.filter(f => f.case_id === data.caseId);

  return { followups };
}

function apiCompleteFollowup(data, user, role) {
  if (!['MSO Admin', 'MSO Coordinator'].includes(role)) throw new Error('권한 없음');
  completeFollowup(data.followupId, { ...data, completedBy: user });
  return { success: true };
}

// ─── Documents ────────────────────────────────────────────────

function apiRegisterDocument(data, user, role) {
  const docId = registerDocument({ ...data, uploadedBy: user });
  return { success: true, documentId: docId };
}

function apiGetDocuments(caseId, user, role) {
  const docs = getLatestDocuments(caseId);
  return { documents: docs };
}

// ─── Appointments ─────────────────────────────────────────────

function apiGetAppointments(data, user, role) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let apts = sheetToObjects_(ss, CONFIG.SHEETS.APPOINTMENTS);
  if (data && data.caseId) apts = apts.filter(a => a.case_id === data.caseId);
  return { appointments: apts };
}

function apiCreateAppointment(data, user, role) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.APPOINTMENTS);
  const aptId = generateCustomId(CONFIG.SHEETS.APPOINTMENTS, 'APT', 'appointment_id');

  const eventId = createCalendarEvent(
    CONFIG.CALENDAR_TYPES.HOSPITAL_COORD,
    `[${data.appointment_type}] ${data.case_id}`,
    new Date(data.scheduled_date),
    `케이스: ${data.case_id}\n유형: ${data.appointment_type}`
  );

  sheet.appendRow([
    aptId, data.case_id, data.appointment_type,
    data.scheduled_date, data.location || '',
    data.responsible_party || user, data.attendee_status || 'Pending',
    'FALSE', eventId || '', data.notes || '',
  ]);

  return { success: true, appointmentId: aptId };
}

// ─── 공통 유틸 ───────────────────────────────────────────────

/**
 * 시트 전체를 객체 배열로 변환
 */
function sheetToObjects_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] instanceof Date ? row[i].toISOString() : row[i];
    });
    return obj;
  });
}
