// MSO ERP - API 함수 전수 구현
// 13_WebApp.js의 dispatchAction_에서 호출됨

// ════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════

/**
 * 대시보드 KPI 데이터 반환
 */
function getDashboardData(user, role, profile) {
  Logger.log(`[getDashboardData] 시작: user="${user}" role="${role}"`);
  try {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const today = new Date();

  const cases    = cachedRead_(ss, CONFIG.SHEETS.CASES);
  const leads    = cachedRead_(ss, CONFIG.SHEETS.LEADS);
  const followups= cachedRead_(ss, CONFIG.SHEETS.FOLLOWUPS);
  const billing  = cachedRead_(ss, CONFIG.SHEETS.BILLING);
  const orders   = cachedRead_(ss, CONFIG.SHEETS.SUPPLIER_ORDERS);
  const reviews  = cachedRead_(ss, CONFIG.SHEETS.MEDICAL_REVIEWS);
  Logger.log(`[getDashboardData] 시트 로드 완료: cases=${cases.length} leads=${leads.length} orders=${orders.length}`);

  // is_deleted 필터 적용
  const allMyCases = filterCasesByRole_(cases, user, role, profile);
  const myCases    = allMyCases.filter(c => !c.is_deleted || String(c.is_deleted).toLowerCase() === 'false');
  const activeLeads= leads.filter(l => !l.is_deleted || String(l.is_deleted).toLowerCase() === 'false');

  // 병원 검토 중 = 본인 케이스 중 Medical_Reviews Pending 건수
  const myCaseIdSet = new Set(myCases.map(c => c.case_id));
  const pendingReviews = reviews.filter(r =>
    r.review_status === CONFIG.REVIEW_STATUS.PENDING && myCaseIdSet.has(r.case_id)
  ).length;

  // 활성 케이스 파이프라인 (Closed/Cancelled 제외)
  const TERMINAL = [CONFIG.CASE_STATUS.CLOSED, CONFIG.CASE_STATUS.CANCELLED];
  const casesByStatus = myCases.reduce((acc, c) => {
    acc[c.case_status] = (acc[c.case_status] || 0) + 1;
    return acc;
  }, {});
  const totalActiveCases = myCases.filter(c => !TERMINAL.includes(c.case_status)).length;

  const patMap = buildPatientNameMap_(ss);

  // 환자명 보강 헬퍼
  function withName(c) { return { ...c, patient_name: patMap[c.case_id] || '' }; }

  const upcomingTreatments = myCases
    .filter(c => c.treatment_date && new Date(c.treatment_date) >= today &&
      c.case_status === CONFIG.CASE_STATUS.SCHEDULED)
    .sort((a,b) => new Date(a.treatment_date) - new Date(b.treatment_date))
    .slice(0, 7)
    .map(withName);

  // 기한 초과 추적관찰 — 최대 5건, 경과일 포함
  const overdueFollowupsList = followups
    .filter(f => f.due_date && !f.completed_date && new Date(f.due_date) < today &&
      myCaseIdSet.has(f.case_id))
    .sort((a,b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5)
    .map(f => ({
      ...f,
      patient_name: patMap[f.case_id] || '',
      days_overdue: Math.floor((today - new Date(f.due_date)) / (1000*60*60*24)),
    }));

  // 검수 대기 목록 — 최대 5건
  const pendingAcceptanceList = orders
    .filter(o => o.supplier_status === CONFIG.SUPPLIER_STATUS.DELIVERED &&
      o.acceptance_check_status !== CONFIG.ACCEPTANCE_STATUS.ACCEPTED &&
      myCaseIdSet.has(o.case_id))
    .slice(0, 5)
    .map(o => ({ ...o, patient_name: patMap[o.case_id] || '' }));

  // 미수금 케이스 — 최대 5건
  const outstandingBillingList = billing
    .filter(b => [CONFIG.PAYMENT_STATUS.INVOICE_SENT, CONFIG.PAYMENT_STATUS.PARTIALLY_PAID]
      .includes(b.payment_status) && myCaseIdSet.has(b.case_id))
    .map(b => ({
      ...b,
      patient_name: patMap[b.case_id] || '',
      outstanding: Number(b.invoice_amount||0) - Number(b.paid_amount||0),
    }))
    .sort((a,b) => b.outstanding - a.outstanding)
    .slice(0, 5);

  return {
    newLeads:           activeLeads.filter(l => l.lead_status === CONFIG.LEAD_STATUS.NEW).length,
    pendingReviews,
    upcomingTreatments,
    overdueFollowups:   overdueFollowupsList.length,
    overdueFollowupsList,
    outstandingAmount: billing
      .filter(b => [CONFIG.PAYMENT_STATUS.INVOICE_SENT, CONFIG.PAYMENT_STATUS.PARTIALLY_PAID]
        .includes(b.payment_status))
      .reduce((s, b) => s + (Number(b.invoice_amount||0) - Number(b.paid_amount||0)), 0),
    outstandingBillingList,
    delayedOrders: orders.filter(o =>
      [CONFIG.SUPPLIER_STATUS.REQUESTED, CONFIG.SUPPLIER_STATUS.CONFIRMED].includes(o.supplier_status) &&
      o.expected_ship_date && new Date(o.expected_ship_date) < today).length,
    pendingAcceptance: pendingAcceptanceList.length,
    pendingAcceptanceList,
    casesByStatus,
    totalActiveCases,
  };
  } catch (err) {
    Logger.log(`[getDashboardData] 오류: ${err.stack || err.message}`);
    throw err;
  }
}

// ════════════════════════════════════════════════════════════
// LEADS
// ════════════════════════════════════════════════════════════

function getLeads(data, user, role, profile) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let leads = cachedRead_(ss, CONFIG.SHEETS.LEADS);

  if (!data.showDeleted) {
    leads = leads.filter(l => !l.is_deleted || String(l.is_deleted).toLowerCase() === 'false');
  }
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
  invalidateCache_(CONFIG.SHEETS.LEADS);
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
    invalidateCache_(CONFIG.SHEETS.LEADS);
  }
  throw new Error(`리드를 찾을 수 없습니다: ${data.lead_id}`);
}

// ════════════════════════════════════════════════════════════
// PATIENTS
// ════════════════════════════════════════════════════════════

function getPatient(patientId, user, role) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const patients = cachedRead_(ss, CONFIG.SHEETS.PATIENTS);
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
  invalidateCache_(CONFIG.SHEETS.CASES);
  let cases = cachedRead_(ss, CONFIG.SHEETS.CASES);
  cases = filterCasesByRole_(cases, user, role, profile);

  if (!data.showDeleted) {
    cases = cases.filter(c => !c.is_deleted || String(c.is_deleted).toLowerCase() === 'false');
  }
  if (data.status) cases = cases.filter(c => c.case_status === data.status);

  const patMap = buildPatientNameMap_(ss);
  cases = cases.map(c => ({ ...c, patient_name: patMap[c.case_id] || '' }));

  if (data.search) {
    const q = data.search.toLowerCase();
    cases = cases.filter(c =>
      (c.case_id||'').toLowerCase().includes(q) ||
      (c.patient_name||'').toLowerCase().includes(q) ||
      (c.hospital_id||'').toLowerCase().includes(q) ||
      (c.target_indication||'').toLowerCase().includes(q)
    );
  }

  return { cases: cases.reverse(), total: cases.length };
}

function createCase_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR].includes(role)) throw new Error('권한 없음');

  let patientId = data.patient_id || '';

  // 리드 전환: 리드 정보로 환자 자동 생성 + 리드 상태 Converted 업데이트
  if (!patientId && data.lead_id) {
    const ss   = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const lead = cachedRead_(ss, CONFIG.SHEETS.LEADS).find(l => l.lead_id === data.lead_id);
    if (lead) {
      const patResult = createPatient(
        { full_name: lead.patient_name, nationality: lead.country,
          phone: lead.phone, email: lead.email },
        user, role
      );
      patientId = patResult.patientId;
      updateLead({ lead_id: data.lead_id, lead_status: CONFIG.LEAD_STATUS.CONVERTED }, user, role);
    }
  }

  const caseId = createCase({
    patientId,
    leadId:              data.lead_id || '',
    hospitalId:          data.hospital_id,
    supplierId:          data.supplier_id || '',
    targetIndication:    data.target_indication,
    assignedCoordinator: data.assigned_coordinator || user,
    priority:            data.priority || 'Normal',
    remarks:             data.remarks || '',
  });
  invalidateCache_(CONFIG.SHEETS.CASES);
  invalidateCache_(CONFIG.SHEETS.LEADS);
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
 * 시술 일정 확정: treatment_date 기록 + Appointments 자동 생성 + Google Calendar 동기화
 */
function scheduleTreatment_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.HOSPITAL_USER].includes(role)) throw new Error('권한 없음');
  if (!data.caseId)        throw new Error('caseId가 필요합니다');
  if (!data.treatmentDate) throw new Error('시술 예정일이 필요합니다');
  if (!data.physician)     throw new Error('담당 의사를 입력하세요');

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const caseSheet = ss.getSheetByName(CONFIG.SHEETS.CASES);
  const rows = sheetToObjects_(ss, CONFIG.SHEETS.CASES);
  const idx  = rows.findIndex(r => r.case_id === data.caseId);
  if (idx < 0) throw new Error('케이스를 찾을 수 없습니다');

  const caseRow = rows[idx];
  const headers = caseSheet.getRange(1, 1, 1, caseSheet.getLastColumn()).getValues()[0];
  const rowNum  = idx + 2;

  function setCol_(name, val) {
    const c = headers.indexOf(name);
    if (c >= 0) caseSheet.getRange(rowNum, c + 1).setValue(val);
  }

  setCol_('treatment_date', data.treatmentDate);
  setCol_('physician',      data.physician);
  if (data.location) setCol_('treatment_location', data.location);
  invalidateCache_(CONFIG.SHEETS.CASES);

  changeCaseStatus(data.caseId, CONFIG.CASE_STATUS.SCHEDULED, user, role);

  // Google Calendar 동기화 (MSO_MASTER + HOSPITAL_COORD)
  const patientCode = caseRow.patient_code || data.caseId;
  const coordName   = caseRow.assigned_coordinator || user;
  let calIds = {};
  try {
    calIds = createTreatmentDayEvent(
      data.caseId, new Date(data.treatmentDate),
      patientCode, coordName, caseRow.hospital_id || '-'
    ) || {};
  } catch (e) { Logger.log('캘린더 이벤트 생성 실패: ' + e.message); }

  // Appointments 시트 자동 등록
  const aptSheet = ss.getSheetByName(CONFIG.SHEETS.APPOINTMENTS);
  const aptId = generateCustomId(CONFIG.SHEETS.APPOINTMENTS, 'APT', 'appointment_id');
  aptSheet.appendRow([
    aptId, data.caseId, 'Treatment Day',
    new Date(data.treatmentDate), '',
    data.location || '', data.physician,
    'Confirmed', false,
    calIds.hospEventId || '',
    data.notes || '',
  ]);
  invalidateCache_(CONFIG.SHEETS.APPOINTMENTS);

  addActivityLog({
    caseId: data.caseId, actorEmail: user, actorRole: role,
    actionType: 'TREATMENT_SCHEDULED',
    summary: `시술 일정 확정: ${data.treatmentDate} / ${data.physician}`,
  });

  return { success: true };
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

  const reviews     = cachedRead_(ss, CONFIG.SHEETS.MEDICAL_REVIEWS).filter(r => r.case_id === caseId);
  const orders      = cachedRead_(ss, CONFIG.SHEETS.SUPPLIER_ORDERS).filter(o => o.case_id === caseId);
  const docs        = cachedRead_(ss, CONFIG.SHEETS.DOCUMENTS).filter(d => d.case_id === caseId && d.is_latest === 'Yes');
  const billing_    = cachedRead_(ss, CONFIG.SHEETS.BILLING).filter(b => b.case_id === caseId);
  const followups   = cachedRead_(ss, CONFIG.SHEETS.FOLLOWUPS).filter(f => f.case_id === caseId);
  const activities  = cachedRead_(ss, CONFIG.SHEETS.ACTIVITY_LOG).filter(a => a.case_id === caseId).slice(-30).reverse();
  const appointments= cachedRead_(ss, CONFIG.SHEETS.APPOINTMENTS).filter(a => a.case_id === caseId);
  const procedures  = cachedRead_(ss, CONFIG.SHEETS.PROCEDURES).filter(p => p.case_id === caseId);

  // Supplier는 환자 정보 미제공
  let patient = null;
  if (role !== ROLES.SUPPLIER_USER && caseData.patient_id) {
    const { patient: p } = getPatient(caseData.patient_id, user, role);
    patient = p;
  }

  // coordinator display_name 조인
  const usersRows  = cachedRead_(ss, CONFIG.SHEETS.USERS);
  const coordUser  = usersRows.find(u => u.user_email === caseData.assigned_coordinator);
  const coordName  = coordUser ? (coordUser.display_name || caseData.assigned_coordinator) : caseData.assigned_coordinator;

  // hospital_name 조인
  const hospRows   = cachedRead_(ss, CONFIG.SHEETS.HOSPITALS);
  const hospRecord = hospRows.find(h => h.hospital_id === caseData.hospital_id);
  const hospName   = hospRecord ? (hospRecord.hospital_name || caseData.hospital_id) : caseData.hospital_id;

  const enrichedCase = { ...caseData, coordinator_name: coordName, hospital_name: hospName };

  // Supplier는 자기 주문만
  const filteredOrders = role === ROLES.SUPPLIER_USER
    ? orders.filter(o => o.supplier_id === profile.supplier_id)
    : orders;

  return {
    case: enrichedCase, patient,
    reviews, orders: filteredOrders, docs,
    billing: billing_, followups, activities, appointments, procedures,
  };
}

// ════════════════════════════════════════════════════════════
// HOSPITAL REVIEW
// ════════════════════════════════════════════════════════════

function requestReview_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR].includes(role)) throw new Error('권한 없음');
  if (!data.caseId) throw new Error('caseId가 필요합니다');
  const reviewId = requestHospitalReview(data.caseId, user, data.linkedOrderId || '');
  return { success: true, reviewId };
}

function getReview(caseId) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const reviews = cachedRead_(ss, CONFIG.SHEETS.MEDICAL_REVIEWS).filter(r => r.case_id === caseId);
  return { reviews };
}

function submitHospitalReview(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.HOSPITAL_USER].includes(role)) throw new Error('권한 없음');
  if (!data.review_result) throw new Error('review_result 필드가 필요합니다');
  if (!data.review_id) throw new Error('review_id 필드가 필요합니다');

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MEDICAL_REVIEWS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const now = new Date();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][headers.indexOf('review_id')] !== data.review_id) continue;

    const caseId        = rows[i][headers.indexOf('case_id')];
    const linkedOrderId = rows[i][headers.indexOf('linked_order_id')];

    const updatable = {
      review_status:          CONFIG.REVIEW_STATUS.COMPLETED,
      review_result:          data.review_result,
      next_medical_step:      data.next_medical_step || '',
      consultation_date:      data.consultation_date ? new Date(data.consultation_date) : '',
      additional_test_required: data.additional_test_required || '',
      medical_notes_link:     data.medical_notes_link || '',
      notes:                  data.notes || '',
      review_completed_date:  now,
      hospital_user:          user,
    };

    Object.entries(updatable).forEach(([field, val]) => {
      const col = headers.indexOf(field);
      if (col !== -1) sheet.getRange(i + 1, col + 1).setValue(val);
    });

    // 추가 검토(linked_order_id 있음) + Suitable → 주문 차단 해제
    if (linkedOrderId && data.review_result === CONFIG.REVIEW_RESULT.SUITABLE) {
      clearAdditionalReview_(linkedOrderId);
    }

    // 케이스 상태 전환 (상태기계 우회 — 검토 결과 전용)
    if (data.review_result === CONFIG.REVIEW_RESULT.SUITABLE) {
      updateCaseField_(caseId, 'hospital_decision_at', now, user);
      updateCaseField_(caseId, 'case_status', CONFIG.CASE_STATUS.HOSPITAL_APPROVED, user);
      notifyStatusChange(caseId, CONFIG.CASE_STATUS.HOSPITAL_APPROVED);
    } else if (data.review_result === CONFIG.REVIEW_RESULT.NOT_SUITABLE) {
      updateCaseField_(caseId, 'case_status', CONFIG.CASE_STATUS.CANCELLED, user);
      notifyStatusChange(caseId, CONFIG.CASE_STATUS.CANCELLED);
    }

    addActivityLog({
      caseId, actorEmail: user, actorRole: role,
      actionType: 'HOSPITAL_REVIEW_SUBMITTED',
      summary: `병원 검토 결과 제출: ${data.review_result}`,
    });

    return { success: true };
  }
  throw new Error('해당 검토를 찾을 수 없습니다');
}

/**
 * 병원 검토 결과 원스텝 기록 — review 레코드가 없어도 생성 후 결과까지 저장.
 * MSO 담당자가 오프라인 협의 결과를 빠르게 기록하는 용도.
 */
function recordHospitalResult_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR].includes(role)) throw new Error('권한 없음');
  if (!data.caseId)       throw new Error('caseId가 필요합니다');
  if (!data.review_result) throw new Error('review_result가 필요합니다');

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  // 기존 Pending 검토 레코드 찾기 (없으면 새로 생성)
  let reviews = cachedRead_(ss, CONFIG.SHEETS.MEDICAL_REVIEWS)
    .filter(r => r.case_id === data.caseId && r.review_status === CONFIG.REVIEW_STATUS.PENDING);

  let reviewId;
  if (reviews.length > 0) {
    reviewId = reviews[0].review_id;
  } else {
    // 케이스가 'Under Hospital Review'가 아니면 먼저 상태 전환
    const caseData = getCaseData_(data.caseId);
    if (caseData && caseData.case_status === CONFIG.CASE_STATUS.DRAFT) {
      changeCaseStatus(data.caseId, CONFIG.CASE_STATUS.UNDER_HOSPITAL_REVIEW, user, role);
    }
    reviewId = requestHospitalReview(data.caseId, user, '');
  }

  // review.submit 재사용
  return submitHospitalReview({
    review_id:         reviewId,
    review_result:     data.review_result,
    consultation_date: data.consultation_date || '',
    notes:             data.notes || '',
  }, user, role);
}

// ════════════════════════════════════════════════════════════
// SUPPLIER ORDERS
// ════════════════════════════════════════════════════════════

function getSupplierOrders(data, user, role, profile) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let orders = cachedRead_(ss, CONFIG.SHEETS.SUPPLIER_ORDERS);

  // 삭제된 케이스의 주문은 제외
  const activeCaseIds = new Set(
    cachedRead_(ss, CONFIG.SHEETS.CASES)
      .filter(c => !c.is_deleted || String(c.is_deleted).toLowerCase() === 'false')
      .map(c => c.case_id)
  );
  orders = orders.filter(o => activeCaseIds.has(o.case_id));

  if (role === ROLES.SUPPLIER_USER) {
    orders = orders.filter(o => o.supplier_id === profile.supplier_id);
  } else if (role === ROLES.MSO_COORDINATOR) {
    const myCaseIds = cachedRead_(ss, CONFIG.SHEETS.CASES)
      .filter(c => c.assigned_coordinator === user).map(c => c.case_id);
    orders = orders.filter(o => myCaseIds.includes(o.case_id));
  }

  if (data.caseId) orders = orders.filter(o => o.case_id === data.caseId);
  if (data.status) orders = orders.filter(o => o.supplier_status === data.status);

  const patMap = buildPatientNameMap_(ss);
  orders = orders.map(o => ({ ...o, patient_name: patMap[o.case_id] || '' }));

  return { orders };
}

function createSupplierOrder_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR].includes(role)) throw new Error('권한 없음');
  const orderId = createSupplierOrder({ ...data, requestedBy: user });
  return { success: true, orderId };
}

function confirmShipment_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR, ROLES.SUPPLIER_USER].includes(role)) throw new Error('권한 없음');
  confirmShipment(data.orderId, { ...data, updatedBy: user });
  invalidateCache_(CONFIG.SHEETS.SUPPLIER_ORDERS, CONFIG.SHEETS.CASES);
  return { success: true };
}

function confirmDelivery_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR].includes(role)) throw new Error('권한 없음');
  confirmDelivery(data.orderId, { ...data, updatedBy: user });
  invalidateCache_(CONFIG.SHEETS.SUPPLIER_ORDERS, CONFIG.SHEETS.CASES);
  return { success: true };
}

function recordAcceptanceCheck_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.HOSPITAL_USER].includes(role)) throw new Error('권한 없음');
  if (!data.result) throw new Error('검수 결과(result) 필드가 필요합니다');
  recordAcceptanceCheck(data.orderId, { result: data.result, notes: data.notes, checkedBy: user });
  invalidateCache_(CONFIG.SHEETS.SUPPLIER_ORDERS, CONFIG.SHEETS.CASES);
  return { success: true };
}

// ════════════════════════════════════════════════════════════
// BILLING
// ════════════════════════════════════════════════════════════

function getBilling(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR, ROLES.FINANCE_USER].includes(role)) throw new Error('권한 없음');
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let rows = cachedRead_(ss, CONFIG.SHEETS.BILLING);
  if (data.caseId) rows = rows.filter(b => b.case_id === data.caseId);
  if (data.onlyOutstanding) {
    rows = rows.filter(b => [CONFIG.PAYMENT_STATUS.INVOICE_SENT, CONFIG.PAYMENT_STATUS.PARTIALLY_PAID].includes(b.payment_status));
  }
  const patMap = buildPatientNameMap_(ss);
  rows = rows.map(b => ({ ...b, patient_name: patMap[b.case_id] || '' }));
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
      'paid_amount','payment_status',
      'quote_agreed_at','quote_sent_at','invoice_sent_at','payment_confirmed_by','payment_confirmed_at',
      'due_date','paid_date','refund_amount','notes'];
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
  invalidateCache_(CONFIG.SHEETS.BILLING);
  return { success: true, billing_id: billingId };
}

function markQuoteAgreed_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR, ROLES.FINANCE_USER].includes(role)) throw new Error('권한 없음');
  if (!data.billingId) throw new Error('billingId가 필요합니다');
  markQuoteAgreed(data.billingId, user);
  invalidateCache_(CONFIG.SHEETS.BILLING);
  return { success: true };
}

function issueQuote_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.FINANCE_USER].includes(role)) throw new Error('권한 없음');
  issueQuote(data.billingId, { ...data, issuedBy: user });
  invalidateCache_(CONFIG.SHEETS.BILLING);
  return { success: true };
}

function issueInvoice_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.FINANCE_USER].includes(role)) throw new Error('권한 없음');
  issueInvoice(data.billingId, { ...data, issuedBy: user });
  invalidateCache_(CONFIG.SHEETS.BILLING);
  return { success: true };
}

function recordPayment_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.FINANCE_USER].includes(role)) throw new Error('권한 없음');
  recordPayment(data.billingId, { paidAmount: data.paidAmount, paidDate: data.paidDate, processedBy: user });
  invalidateCache_(CONFIG.SHEETS.BILLING);
  return { success: true };
}

// ════════════════════════════════════════════════════════════
// FOLLOWUPS
// ════════════════════════════════════════════════════════════

function getFollowups(data, user, role, profile) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let rows = cachedRead_(ss, CONFIG.SHEETS.FOLLOWUPS);

  if (role === ROLES.MSO_COORDINATOR) {
    rows = rows.filter(f => f.responsible_party === user);
  }
  if (data.caseId) rows = rows.filter(f => f.case_id === data.caseId);
  if (data.onlyPending) rows = rows.filter(f => !f.completed_date);

  const patMap = buildPatientNameMap_(ss);
  rows = rows.map(f => ({ ...f, patient_name: patMap[f.case_id] || '' }));

  return { followups: rows };
}

function completeFollowup_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR].includes(role)) throw new Error('권한 없음');
  completeFollowup(data.followupId, {
    patientResponse: data.patientResponse,
    nextVisitDate:   data.nextVisitDate,
    notes:           data.notes,
    escalationRequired: data.escalationRequired,
    completedBy: user,
  });
  invalidateCache_(CONFIG.SHEETS.FOLLOWUPS);
  return { success: true };
}

// ════════════════════════════════════════════════════════════
// DOCUMENTS
// ════════════════════════════════════════════════════════════

function registerDocument_api(data, user, role) {
  const docId = registerDocument({ ...data, uploadedBy: user });
  invalidateCache_(CONFIG.SHEETS.DOCUMENTS);
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
  let apts = cachedRead_(ss, CONFIG.SHEETS.APPOINTMENTS);

  if (data.caseId) {
    apts = apts.filter(a => a.case_id === data.caseId);
  } else {
    // 팀 전체 조회 시 케이스에서 hospital_id + assigned_coordinator 조인
    const caseMap = {};
    cachedRead_(ss, CONFIG.SHEETS.CASES).forEach(c => { caseMap[c.case_id] = c; });
    apts = apts.map(a => {
      const c = caseMap[a.case_id] || {};
      return { ...a, hospital_id: c.hospital_id || '', assigned_coordinator: c.assigned_coordinator || '' };
    });
  }

  // 날짜 오름차순 정렬
  apts.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

  return { appointments: apts };
}

function createAppointment_api(data, user, role) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.APPOINTMENTS);
  const aptId = generateCustomId(CONFIG.SHEETS.APPOINTMENTS, 'APT', 'appointment_id');

  const aptTitle = `[${data.appointment_type}] ${data.case_id}`;
  const aptDesc  = `케이스: ${data.case_id}\n유형: ${data.appointment_type}\n장소: ${data.location||'-'}`;
  let eventId = '';
  try {
    createCalendarEvent(CONFIG.CALENDAR_TYPES.MSO_MASTER, aptTitle, new Date(data.scheduled_date), aptDesc);
    eventId = createCalendarEvent(CONFIG.CALENDAR_TYPES.HOSPITAL_COORD, aptTitle, new Date(data.scheduled_date), aptDesc) || '';
  } catch (e) { Logger.log('캘린더 이벤트 생성 실패: ' + e.message); }

  sheet.appendRow([
    aptId, data.case_id, data.appointment_type,
    data.scheduled_date ? new Date(data.scheduled_date) : '',
    data.scheduled_time || '',
    data.location || '',
    data.responsible_party || user,
    data.attendee_status || 'Pending',
    false, eventId, data.notes || '',
  ]);

  invalidateCache_(CONFIG.SHEETS.APPOINTMENTS);
  return { success: true, appointmentId: aptId };
}

// ════════════════════════════════════════════════════════════
// CALENDAR EVENTS (통합)
// ════════════════════════════════════════════════════════════

function getCalendarEvents(data, user, role, profile) {
  const ss   = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const events = [];

  // 권한별 허용 케이스 ID 집합
  const allCases  = cachedRead_(ss, CONFIG.SHEETS.CASES)
    .filter(c => !c.is_deleted || String(c.is_deleted).toLowerCase() === 'false');
  const myCases   = filterCasesByRole_(allCases, user, role, profile);
  const caseIdSet = new Set(myCases.map(c => c.case_id));
  const caseMap   = {};
  myCases.forEach(c => { caseMap[c.case_id] = c; });

  // 1. 시술 예정일 (Cases.treatment_date)
  myCases.forEach(c => {
    if (!c.treatment_date) return;
    events.push({
      date:   String(c.treatment_date).substring(0, 10),
      type:   'treatment',
      title:  `시술 · ${c.target_indication || ''}`.trim(),
      caseId: c.case_id,
    });
  });

  // 2. 추적관찰 마감일 (Followups.due_date, 미완료만)
  cachedRead_(ss, CONFIG.SHEETS.FOLLOWUPS)
    .filter(f => caseIdSet.has(f.case_id) && f.due_date && !f.completed_date)
    .forEach(f => {
      events.push({
        date:   String(f.due_date).substring(0, 10),
        type:   'followup',
        title:  `추적 ${f.followup_stage || ''}`.trim(),
        caseId: f.case_id,
      });
    });

  // 3. 예정 출고일 (Supplier_Orders, 배송 전 주문만)
  cachedRead_(ss, CONFIG.SHEETS.SUPPLIER_ORDERS)
    .filter(o => caseIdSet.has(o.case_id) && o.expected_ship_date &&
      ['Requested','Confirmed'].includes(o.supplier_status))
    .forEach(o => {
      events.push({
        date:   String(o.expected_ship_date).substring(0, 10),
        type:   'shipment',
        title:  o.requested_item || '예정 출고',
        caseId: o.case_id,
      });
    });

  // 4. 팀 일정 (Appointments)
  cachedRead_(ss, CONFIG.SHEETS.APPOINTMENTS)
    .filter(a => caseIdSet.has(a.case_id))
    .forEach(a => {
      if (!a.scheduled_date) return;
      events.push({
        date:   String(a.scheduled_date).substring(0, 10),
        type:   'appointment',
        title:  a.appointment_type || '일정',
        caseId: a.case_id,
      });
    });

  // 5. 결제 마감일 (Billing.due_date, 미납만)
  if ([ROLES.MSO_ADMIN, ROLES.FINANCE_USER, ROLES.MSO_COORDINATOR].includes(role)) {
    cachedRead_(ss, CONFIG.SHEETS.BILLING)
      .filter(b => caseIdSet.has(b.case_id) && b.due_date &&
        ['Invoice Sent','Partially Paid'].includes(b.payment_status))
      .forEach(b => {
        events.push({
          date:   String(b.due_date).substring(0, 10),
          type:   'billing',
          title:  '결제 마감',
          caseId: b.case_id,
        });
      });
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return { events };
}

// ════════════════════════════════════════════════════════════
// PROCEDURES
// ════════════════════════════════════════════════════════════

function getProcedures_api(data, user, role, profile) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let procedures = cachedRead_(ss, CONFIG.SHEETS.PROCEDURES);
  if (data.caseId) procedures = procedures.filter(p => p.case_id === data.caseId);
  return { procedures };
}

function createProcedure_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR].includes(role)) throw new Error('권한 없음');
  if (!data.caseId) throw new Error('caseId가 필요합니다');

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PROCEDURES);
  const procedureId = generateCustomId(CONFIG.SHEETS.PROCEDURES, CONFIG.ID_PREFIXES.PROCEDURES, 'procedure_id');
  const now = new Date();

  // Procedures 헤더: procedure_id, case_id, order_id, procedure_date, procedure_type,
  //   physician, hospital_id, location, status, outcome_notes, follow_up_notes,
  //   recorded_by, created_at
  sheet.appendRow([
    procedureId,
    data.caseId,
    data.orderId || '',
    data.procedureDate ? new Date(data.procedureDate) : '',
    data.procedureType || '',
    data.physician || '',
    data.hospitalId || '',
    data.location || '',
    CONFIG.PROCEDURE_STATUS.PLANNED,
    data.outcomeNotes || '',
    data.followUpNotes || '',
    user,
    now,
  ]);

  addActivityLog({
    caseId: data.caseId,
    actorEmail: user,
    actorRole: role,
    actionType: 'PROCEDURE_RECORDED',
    summary: `시술 기록 생성: ${procedureId} (${data.procedureType || ''})`,
  });

  return { success: true, procedureId };
  invalidateCache_(CONFIG.SHEETS.PROCEDURES);
}

// ════════════════════════════════════════════════════════════
// 공통 유틸
// ════════════════════════════════════════════════════════════

/**
 * case_id → patient_name 맵 반환
 * Cases + Patients 시트를 조인
 */
function buildPatientNameMap_(ss) {
  const cases    = cachedRead_(ss, CONFIG.SHEETS.CASES);
  const patients = cachedRead_(ss, CONFIG.SHEETS.PATIENTS);
  const patMap   = {};
  patients.forEach(p => { patMap[p.patient_id] = p.full_name || p.patient_code || ''; });
  const caseMap  = {};
  cases.forEach(c => { caseMap[c.case_id] = patMap[c.patient_id] || ''; });
  return caseMap;
}

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

// ─── CacheService 래퍼 ───────────────────────────────────────

const CACHE_TTL_ = {
  [CONFIG.SHEETS.CASES]:           120,
  [CONFIG.SHEETS.LEADS]:           120,
  [CONFIG.SHEETS.SUPPLIER_ORDERS]: 60,
  [CONFIG.SHEETS.MEDICAL_REVIEWS]: 120,
  [CONFIG.SHEETS.BILLING]:         180,
  [CONFIG.SHEETS.FOLLOWUPS]:       180,
  [CONFIG.SHEETS.DOCUMENTS]:       300,
  [CONFIG.SHEETS.HOSPITALS]:       1800,
  [CONFIG.SHEETS.SUPPLIERS]:       1800,
  [CONFIG.SHEETS.USERS]:           1800,
};

function cachedRead_(ss, sheetName) {
  const cache = CacheService.getScriptCache();
  const key = 'sheet_' + sheetName;
  try {
    const hit = cache.get(key);
    if (hit) return JSON.parse(hit);
  } catch(e) {}

  const rows = sheetToObjects_(ss, sheetName);
  try {
    const json = JSON.stringify(rows);
    if (json.length < 95000) {
      cache.put(key, json, CACHE_TTL_[sheetName] || 120);
    }
  } catch(e) {}
  return rows;
}

function invalidateCache_() {
  const cache = CacheService.getScriptCache();
  const keys = Array.from(arguments).map(n => 'sheet_' + n);
  cache.removeAll(keys);
}

// ════════════════════════════════════════════════════════════
// 참조 데이터 (케이스 전환 모달용)
// ════════════════════════════════════════════════════════════

/**
 * 소프트삭제 컬럼이 없으면 시트에 추가 후 headers 배열도 갱신
 */
function ensureSoftDeleteCols_(sheet, headers) {
  const SOFT_COLS = ['is_deleted', 'deleted_at', 'deleted_by', 'delete_reason'];
  let added = false;
  SOFT_COLS.forEach(col => {
    if (headers.indexOf(col) === -1) {
      const newIdx = sheet.getLastColumn() + 1;
      sheet.getRange(1, newIdx).setValue(col);
      sheet.getRange(1, newIdx).setFontWeight('bold').setBackground('#4A86E8').setFontColor('#FFFFFF');
      headers.push(col);
      added = true;
    }
  });
  if (added) Logger.log(`[ensureSoftDeleteCols_] ${sheet.getName()}에 소프트삭제 컬럼 추가`);
}

function softDeleteLead_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR].includes(role)) throw new Error('권한 없음');
  if (!data.leadId) throw new Error('leadId가 필요합니다');

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.LEADS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  ensureSoftDeleteCols_(sheet, headers);

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][headers.indexOf('lead_id')] !== data.leadId) continue;
    if (role === ROLES.MSO_COORDINATOR &&
        rows[i][headers.indexOf('assigned_coordinator')] !== user) {
      throw new Error('본인 담당 리드만 삭제할 수 있습니다');
    }
    const set = (field, val) => {
      const col = headers.indexOf(field);
      if (col !== -1) sheet.getRange(i + 1, col + 1).setValue(val);
    };
    set('is_deleted',    true);
    set('deleted_at',    new Date());
    set('deleted_by',    user);
    set('delete_reason', data.reason || '');
    invalidateCache_(CONFIG.SHEETS.LEADS);
    return { success: true };
  }
  throw new Error('리드를 찾을 수 없습니다');
}

function softDeleteCase_api(data, user, role) {
  if (![ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR].includes(role)) throw new Error('권한 없음');
  if (!data.caseId) throw new Error('caseId가 필요합니다');

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEETS.CASES);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  ensureSoftDeleteCols_(sheet, headers);

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][headers.indexOf('case_id')] !== data.caseId) continue;
    if (role === ROLES.MSO_COORDINATOR &&
        rows[i][headers.indexOf('assigned_coordinator')] !== user) {
      throw new Error('본인 담당 케이스만 삭제할 수 있습니다');
    }
    const set = (field, val) => {
      const col = headers.indexOf(field);
      if (col !== -1) sheet.getRange(i + 1, col + 1).setValue(val);
    };
    set('is_deleted',    true);
    set('deleted_at',    new Date());
    set('deleted_by',    user);
    set('delete_reason', data.reason || '');
    addActivityLog({
      caseId: data.caseId, actorEmail: user, actorRole: role,
      actionType: 'CASE_DELETED',
      summary: `케이스 소프트 삭제: ${data.caseId} (사유: ${data.reason || '미기재'})`,
    });
    invalidateCache_(CONFIG.SHEETS.CASES);
    return { success: true };
  }
  throw new Error('케이스를 찾을 수 없습니다');
}

/**
 * 케이스 전환 모달 - 병원 드롭다운 데이터
 */
function getHospitalList() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const hospitals = cachedRead_(ss, CONFIG.SHEETS.HOSPITALS)
    .filter(h => String(h.active).toLowerCase() !== 'no' && String(h.active).toLowerCase() !== 'false')
    .map(h => ({ id: h.hospital_id, name: h.hospital_name || h.hospital_id }));
  return { hospitals };
}

function getSupplierList() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const suppliers = cachedRead_(ss, CONFIG.SHEETS.SUPPLIERS)
    .filter(s => String(s.active).toLowerCase() !== 'no' && String(s.active).toLowerCase() !== 'false')
    .map(s => ({ id: s.supplier_id, name: s.supplier_name || s.supplier_id }));
  return { suppliers };
}

/**
 * 케이스 전환 모달 - MSO 담당자 드롭다운 데이터
 * MSO Admin은 전체 코디네이터 목록, 코디네이터는 자기 자신만 표시
 */
function getCoordinatorList(user, role) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const allUsers = cachedRead_(ss, CONFIG.SHEETS.USERS);

  if (role === ROLES.MSO_ADMIN) {
    const coordinators = allUsers
      .filter(u => [ROLES.MSO_ADMIN, ROLES.MSO_COORDINATOR].includes(u.role) &&
                   String(u.active).toLowerCase() !== 'no')
      .map(u => ({ email: u.user_email, name: u.display_name || u.user_email, role: u.role }));
    return { coordinators };
  }

  // 코디네이터 본인만 선택 가능
  const me = allUsers.find(u => u.user_email === user);
  return {
    coordinators: [{ email: user, name: me ? me.display_name || user : user, role }],
  };
}
