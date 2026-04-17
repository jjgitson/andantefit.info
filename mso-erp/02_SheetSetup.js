// MSO ERP - 시트 초기화 모듈
// setupAllSheets() 를 한 번 실행하면 모든 탭과 헤더가 생성됨

const SHEET_HEADERS = {
  Users: [
    'user_email', 'role', 'display_name',
    'hospital_id', 'supplier_id',
    'active', 'allowed_case_scope', 'created_at',
  ],

  Patients: [
    'patient_id', 'patient_code', 'full_name', 'english_name',
    'date_of_birth', 'sex', 'nationality', 'passport_no',
    'phone', 'email', 'preferred_language',
    'guardian_name', 'guardian_contact',
    'consent_privacy', 'consent_data_transfer',
    'created_at', 'owner_coordinator',
  ],

  Leads: [
    'lead_id', 'inquiry_date', 'source_channel',
    'patient_name', 'country', 'phone', 'email',
    'chief_interest', 'assigned_coordinator', 'lead_status',
    'patient_id', 'converted_to_case_id', 'notes', 'created_at',
  ],

  Cases: [
    'case_id', 'patient_id', 'lead_id', 'hospital_id', 'supplier_id',
    'case_status', 'target_indication', 'assigned_coordinator',
    'hospital_review_requested_at', 'hospital_decision_at',
    'treatment_date', 'followup_due_date',
    'priority', 'remarks',
    'drive_folder_id', 'drive_folder_url',
    'case_opened_at', 'case_closed_at',
  ],

  Hospitals: [
    'hospital_id', 'hospital_name', 'primary_contact',
    'email', 'phone', 'address', 'country', 'active',
  ],

  Suppliers: [
    'supplier_id', 'supplier_name', 'product_type',
    'primary_contact', 'email', 'phone', 'country', 'active',
  ],

  Medical_Review: [
    'review_id', 'case_id', 'hospital_id',
    'review_request_date', 'review_completed_date',
    'hospital_user', 'review_result', 'next_medical_step',
    'consultation_date', 'additional_test_required',
    'medical_notes_link', 'notes',
  ],

  Supplier_Orders: [
    'supplier_order_id', 'case_id', 'supplier_id',
    'request_date', 'requested_item', 'quantity',
    'expected_ship_date', 'confirmed_ship_date', 'delivery_date',
    'lot_batch_no', 'coa_link',
    'shipment_tracking_no', 'supplier_status',
    'storage_condition', 'temp_log_link',
    'transport_incident_flag', 'transport_incident_notes',
    'acceptance_check_status', 'acceptance_checked_by',
    'acceptance_checked_at', 'acceptance_notes', 'notes',
  ],

  Appointments: [
    'appointment_id', 'case_id', 'appointment_type',
    'scheduled_date', 'location', 'responsible_party',
    'attendee_status', 'reminder_sent', 'calendar_event_id', 'notes',
  ],

  Billing: [
    'billing_id', 'case_id', 'quote_no', 'invoice_no',
    'currency', 'quote_amount', 'invoice_amount', 'paid_amount',
    'payment_status', 'due_date', 'paid_date',
    'refund_amount', 'calendar_event_id', 'notes',
  ],

  Followups: [
    'followup_id', 'case_id', 'followup_stage',
    'due_date', 'completed_date', 'responsible_party',
    'escalation_required', 'patient_response',
    'followup_notes', 'calendar_event_id',
  ],

  Documents: [
    'document_id', 'case_id', 'patient_id',
    'document_type', 'file_name', 'version_no',
    'is_latest', 'replaces_document_id',
    'uploaded_by', 'upload_date',
    'drive_link', 'verification_status',
    'expiry_date', 'notes',
  ],

  Activity_Log: [
    'activity_id', 'case_id', 'activity_date',
    'actor_role', 'actor_name', 'actor_email',
    'action_type', 'summary', 'next_action', 'next_action_date',
  ],

  Audit_Log: [
    'audit_id', 'entity_name', 'entity_id',
    'field_name', 'old_value', 'new_value',
    'edited_by', 'edited_at', 'change_source',
  ],

  Master_Status: [
    'entity_name', 'status_value', 'display_name', 'description', 'sort_order',
  ],

  Master_Status_Transitions: [
    'entity_name', 'from_status', 'to_status',
    'allowed_roles', 'requires_field', 'description',
  ],

  Master_DocumentTypes: [
    'doc_type_key', 'display_name', 'required_for_case',
    'expiry_tracked', 'notes',
  ],

  Master_Calendar_Config: [
    'calendar_type', 'calendar_id', 'display_name', 'active',
  ],

  Dashboard_Source: [
    'metric_name', 'metric_value', 'metric_date', 'category', 'notes',
  ],
};

/**
 * 전체 시트 탭 및 헤더 초기화 (최초 1회 실행)
 */
function setupAllSheets() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  Object.entries(SHEET_HEADERS).forEach(([sheetName, headers]) => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log(`시트 생성: ${sheetName}`);
    }

    // 헤더가 없거나 다르면 덮어쓰기
    const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (firstRow[0] !== headers[0]) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#4A86E8')
        .setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }
  });

  seedMasterData_(ss);
  Logger.log('전체 시트 초기화 완료');
  SpreadsheetApp.getUi().alert('MSO-ERP 시트 초기화가 완료되었습니다.');
}

/**
 * 마스터 데이터 초기값 입력
 */
function seedMasterData_(ss) {
  seedStatusMaster_(ss);
  seedTransitionMaster_(ss);
  seedDocTypeMaster_(ss);
  seedCalendarConfig_(ss);
}

function seedStatusMaster_(ss) {
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MASTER_STATUS);
  if (sheet.getLastRow() > 1) return;

  const rows = [
    // Cases
    ['Cases', 'Draft', '초안', '케이스 초안 상태', 1],
    ['Cases', 'Under Hospital Review', '병원 검토 중', '', 2],
    ['Cases', 'Hospital Approved', '병원 승인', '', 3],
    ['Cases', 'Supplier Coordination', '공급업체 조율', '', 4],
    ['Cases', 'Treatment Preparation', '시술 준비', '', 5],
    ['Cases', 'Shipment In Transit', '배송 중', '', 6],
    ['Cases', 'Acceptance Check Pending', '입고 검수 대기', '', 7],
    ['Cases', 'Acceptance Confirmed', '입고 확인', '', 8],
    ['Cases', 'Scheduled', '시술 예정', '', 9],
    ['Cases', 'Completed', '완료', '', 10],
    ['Cases', 'Follow-up Ongoing', '추적관찰 중', '', 11],
    ['Cases', 'Closed', '종료', '', 12],
    ['Cases', 'Cancelled', '취소', '', 13],
    // Leads
    ['Leads', 'New', '신규', '', 1],
    ['Leads', 'Contacted', '연락 완료', '', 2],
    ['Leads', 'Awaiting Documents', '자료 수집 중', '', 3],
    ['Leads', 'Ready for Hospital Review', '병원 검토 요청 가능', '', 4],
    ['Leads', 'Closed - No Progress', '진행 불가 종료', '', 5],
  ];

  sheet.getRange(2, 1, rows.length, 5).setValues(rows);
}

function seedTransitionMaster_(ss) {
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MASTER_TRANSITIONS);
  if (sheet.getLastRow() > 1) return;

  const rows = [
    ['Cases', 'Draft', 'Under Hospital Review', 'MSO Admin,MSO Coordinator', '', '병원 검토 요청'],
    ['Cases', 'Draft', 'Cancelled', 'MSO Admin', '', '케이스 취소'],
    ['Cases', 'Under Hospital Review', 'Hospital Approved', 'MSO Admin,Hospital User', '', '병원 승인'],
    ['Cases', 'Under Hospital Review', 'Draft', 'MSO Admin,Hospital User', '', '추가 정보 요청으로 반려'],
    ['Cases', 'Under Hospital Review', 'Cancelled', 'MSO Admin', '', '취소'],
    ['Cases', 'Hospital Approved', 'Supplier Coordination', 'MSO Admin,MSO Coordinator', '', '공급 조율 시작'],
    ['Cases', 'Supplier Coordination', 'Treatment Preparation', 'MSO Admin,MSO Coordinator', '', '공급 확정'],
    ['Cases', 'Treatment Preparation', 'Shipment In Transit', 'MSO Admin,Supplier User', '', '출고'],
    ['Cases', 'Shipment In Transit', 'Acceptance Check Pending', 'MSO Admin,MSO Coordinator', '', '병원 도착'],
    ['Cases', 'Acceptance Check Pending', 'Acceptance Confirmed', 'MSO Admin,Hospital User', '', '입고 검수 통과'],
    ['Cases', 'Acceptance Check Pending', 'Supplier Coordination', 'MSO Admin,Hospital User', '', '입고 검수 반려'],
    ['Cases', 'Acceptance Confirmed', 'Scheduled', 'MSO Admin,Hospital User', '', '시술 일정 확정'],
    ['Cases', 'Scheduled', 'Completed', 'MSO Admin,Hospital User', '', '시술 완료'],
    ['Cases', 'Completed', 'Follow-up Ongoing', 'MSO Admin,MSO Coordinator', '', '추적관찰 시작'],
    ['Cases', 'Follow-up Ongoing', 'Closed', 'MSO Admin,MSO Coordinator', '', '케이스 종료'],
    ['Cases', 'Completed', 'Closed', 'MSO Admin', '', '추적관찰 없이 종료'],
  ];

  sheet.getRange(2, 1, rows.length, 6).setValues(rows);
}

function seedDocTypeMaster_(ss) {
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MASTER_DOC_TYPES);
  if (sheet.getLastRow() > 1) return;

  const rows = [
    ['PASSPORT', 'Passport / ID', 'TRUE', 'TRUE', ''],
    ['CONSENT_PRIVACY', 'Consent - Privacy', 'TRUE', 'FALSE', ''],
    ['CONSENT_DATA', 'Consent - Data Transfer', 'TRUE', 'FALSE', ''],
    ['MEDICAL_RECORD', 'Medical Record', 'FALSE', 'FALSE', ''],
    ['LAB_RESULT', 'Lab Result', 'FALSE', 'TRUE', '유효기간 있음'],
    ['IMAGING', 'Imaging', 'FALSE', 'FALSE', ''],
    ['HOSPITAL_REVIEW_NOTE', 'Hospital Review Note', 'FALSE', 'FALSE', ''],
    ['QUOTE', 'Quote', 'FALSE', 'FALSE', ''],
    ['INVOICE', 'Invoice', 'FALSE', 'FALSE', ''],
    ['PAYMENT_RECEIPT', 'Payment Receipt', 'FALSE', 'FALSE', ''],
    ['SUPPLIER_COA', 'Supplier COA', 'FALSE', 'TRUE', ''],
    ['SHIPPING_DOC', 'Shipping Document', 'FALSE', 'FALSE', ''],
    ['TEMP_LOG', 'Temperature Log', 'FALSE', 'FALSE', ''],
    ['TREATMENT_SUMMARY', 'Treatment Summary', 'FALSE', 'FALSE', ''],
    ['FOLLOWUP_REPORT', 'Follow-up Report', 'FALSE', 'FALSE', ''],
  ];

  sheet.getRange(2, 1, rows.length, 5).setValues(rows);
}

function seedCalendarConfig_(ss) {
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MASTER_CALENDAR);
  if (sheet.getLastRow() > 1) return;

  // calendar_id는 실제 Google Calendar ID로 교체 필요
  const rows = [
    ['MSO_MASTER', 'primary', 'MSO Master Calendar', 'TRUE'],
    ['HOSPITAL_COORD', '', 'Hospital Coordination Calendar', 'TRUE'],
    ['SUPPLIER_LOGISTICS', '', 'Supplier Logistics Calendar', 'TRUE'],
    ['BILLING_DEADLINE', '', 'Billing Deadline Calendar', 'TRUE'],
  ];

  sheet.getRange(2, 1, rows.length, 4).setValues(rows);
}
