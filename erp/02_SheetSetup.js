// MSO ERP - 시트 초기화 모듈
// setupAllSheets() 를 한 번 실행하면 모든 탭과 헤더가 생성됨

// ─── 최종 20개 시트 헤더 정의 (Procedures 포함) ───────────────────
// 규칙: 시트명은 복수형 유지 / active 컬럼은 Boolean (TRUE/FALSE)
// patient_code는 Patients에서만 생성, Cases는 patient_id로 참조

const SHEET_HEADERS = {

  // 1. 사용자
  Users: [
    'user_email', 'role', 'display_name',
    'hospital_id', 'supplier_id',
    'active',            // Boolean: TRUE / FALSE
    'allowed_case_scope', // 'all' | 'own'
    'created_at',
  ],

  // 2. 환자 (patient_code 생성 주체)
  Patients: [
    'patient_id', 'patient_code',   // patient_code는 여기서만 생성
    'full_name', 'english_name',
    'date_of_birth', 'sex', 'nationality', 'passport_no',
    'phone', 'email', 'preferred_language',
    'guardian_name', 'guardian_contact',
    'consent_privacy', 'consent_data_transfer',
    'created_at', 'owner_coordinator',
  ],

  // 3. 리드
  Leads: [
    'lead_id', 'inquiry_date', 'source_channel',
    'patient_name', 'country', 'phone', 'email',
    'chief_interest', 'assigned_coordinator',
    'lead_status',        // → Master_Status (lead_status)
    'patient_id', 'converted_to_case_id',
    'notes', 'created_at',
  ],

  // 4. 케이스 (patient_code 없음 — patient_id로 Patients 참조)
  Cases: [
    'case_id', 'patient_id', 'lead_id',
    'hospital_id', 'supplier_id',
    'case_status',        // → Master_Status (case_status)
    'target_indication', 'assigned_coordinator',
    'hospital_review_requested_at', 'hospital_decision_at',
    'treatment_date', 'followup_due_date',
    'priority', 'remarks',
    'drive_folder_id', 'drive_folder_url',
    'case_opened_at', 'case_closed_at',
  ],

  // 5. 병원 마스터
  Hospitals: [
    'hospital_id', 'hospital_name', 'primary_contact',
    'email', 'phone', 'address', 'country',
    'active',            // Boolean
  ],

  // 6. 공급업체 마스터
  Suppliers: [
    'supplier_id', 'supplier_name', 'product_type',
    'primary_contact', 'email', 'phone', 'country',
    'active',            // Boolean
  ],

  // 7. 병원 심사 (반복 가능 — 케이스당 N건)
  Medical_Reviews: [
    'review_id', 'case_id', 'hospital_id',
    'linked_order_id',    // 추가 검토를 유발한 주문 ID (최초 검토는 빈값)
    'review_request_date', 'review_completed_date',
    'hospital_user',
    'review_status',      // Pending | Completed
    'review_result',      // Suitable | Not Suitable | Deferred | Need More Information
    'next_medical_step',
    'consultation_date', 'additional_test_required',
    'medical_notes_link', 'notes',
  ],

  // 8. 공급 주문 (케이스당 N건 가능)
  Supplier_Orders: [
    'supplier_order_id', 'case_id', 'supplier_id',
    'request_date', 'requested_item', 'quantity',
    'expected_ship_date', 'confirmed_ship_date', 'delivery_date',
    'lot_batch_no', 'coa_link',
    'shipment_tracking_no',
    'supplier_status',              // → Master_Status (supplier_status)
    'storage_condition', 'temp_log_link',
    'transport_incident_flag', 'transport_incident_notes',
    'acceptance_check_status',      // → Master_Status (acceptance_status): 최신 결과 참조용
    'requires_additional_review',   // Boolean: 이 주문에 대해 추가 병원 검토 필요 여부
    'additional_review_cleared',    // Boolean: 추가 검토 완료(Suitable) 확인됨
    'pickup_person',                // MSO 픽업 담당자 이름/연락처
    'acceptance_person',            // 병원 측 인수 담당자 이름
    'cautions',                     // 취급 유의사항 (냉장, 충격금지 등)
    'mso_notes',                    // MSO 내부 협의 메모
    'notes',
  ],

  // 9. 시술/주사 기록 (케이스당 N건 가능)
  Procedures: [
    'procedure_id', 'case_id',
    'order_id',           // 연계 주문 ID (선택)
    'procedure_date',
    'procedure_type',     // Cell Injection | IV Infusion | Consultation | Other
    'physician',          // 시술 의사
    'hospital_id',
    'location',           // 시술 장소/병동
    'status',             // Planned | Completed | Cancelled
    'outcome_notes',      // 시술 결과/경과
    'follow_up_notes',    // 후속 조치
    'recorded_by',        // 기록자 이메일
    'created_at',
  ],

  // 11. 입고 검수 기록 (Acceptance_Checks — Supplier_Orders 1:N)
  Acceptance_Checks: [
    'acceptance_id', 'supplier_order_id', 'case_id',
    'check_date', 'checked_by_email',
    'result',    // Accepted | Rejected
    'notes', 'created_at',
  ],

  // 12. 일정
  Appointments: [
    'appointment_id', 'case_id', 'appointment_type',
    'scheduled_date', 'scheduled_time', 'location',
    'responsible_party', 'attendee_status',
    'reminder_sent', 'calendar_event_id', 'notes',
  ],

  // 13. 결제/청구
  Billing: [
    'billing_id', 'case_id',
    'quote_no', 'invoice_no',
    'currency', 'quote_amount', 'invoice_amount', 'paid_amount',
    'payment_status',        // → Master_Status (payment_status)
    'quote_agreed_at',       // 견적 협의 완료 일시 (MSO 기록)
    'quote_sent_at',         // 견적서 전달 일시
    'invoice_sent_at',       // 인보이스 전달 일시
    'payment_confirmed_by',  // 입금 확인자 이메일
    'payment_confirmed_at',  // 입금 확인 일시
    'due_date', 'paid_date',
    'refund_amount', 'calendar_event_id', 'notes',
  ],

  // 14. 추적관찰
  Followups: [
    'followup_id', 'case_id',
    'followup_stage',    // D7 | D14 | D30 | D90 | D180
    'due_date', 'completed_date', 'responsible_party',
    'escalation_required',  // Boolean
    'patient_response', 'followup_notes', 'calendar_event_id',
  ],

  // 15. 문서
  Documents: [
    'document_id', 'case_id', 'patient_id',
    'document_type', 'file_name', 'version_no',
    'is_latest',             // Boolean
    'replaces_document_id',
    'uploaded_by', 'upload_date',
    'drive_link', 'verification_status',
    'expiry_date', 'notes',
  ],

  // 16. 활동 로그
  Activity_Log: [
    'activity_id', 'case_id', 'activity_date',
    'actor_role', 'actor_name', 'actor_email',
    'action_type', 'summary', 'next_action', 'next_action_date',
  ],

  // 17. 감사 로그
  Audit_Log: [
    'audit_id', 'entity_name', 'entity_id',
    'field_name', 'old_value', 'new_value',
    'edited_by', 'edited_at', 'change_source',
  ],

  // 18. 상태값 마스터 (모든 엔티티 상태 정의)
  Master_Status: [
    'status_key',      // 컬럼명 기준 키 (예: case_status, lead_status, review_result)
    'status_value',    // 실제 저장값 (영어)
    'display_name',    // 화면 표시명 (한국어)
    'description',
    'sort_order',
  ],

  // 19. 상태 전환 규칙
  Master_Status_Transitions: [
    'entity_name', 'from_status', 'to_status',
    'allowed_roles', 'requires_field', 'description',
  ],

  // 20. 문서 유형 마스터
  Master_DocumentTypes: [
    'doc_type_key', 'display_name', 'required_for_case',
    'expiry_tracked', 'notes',
  ],

  // 21. 구글 캘린더 연동 설정
  Master_Calendar_Config: [
    'calendar_type', 'calendar_id', 'display_name',
    'active',    // Boolean
  ],
};

// ─── 공개 함수 ────────────────────────────────────────────────────

/**
 * 전체 시트 탭 및 헤더 초기화 (최초 1회 실행)
 * 총 20개 시트 + Procedures 포함 생성
 */
function setupAllSheets() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  Object.entries(SHEET_HEADERS).forEach(([sheetName, headers]) => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log(`시트 생성: ${sheetName}`);
    }

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
  Logger.log(`전체 시트 초기화 완료 (${Object.keys(SHEET_HEADERS).length}개)`);

  try {
    SpreadsheetApp.getUi().alert(
      `MSO-ERP 시트 초기화 완료\n총 ${Object.keys(SHEET_HEADERS).length}개 시트가 준비되었습니다.`
    );
  } catch(e) { /* 스크립트 편집기에서 실행 시 무시 */ }
}

// ─── 마스터 데이터 초기값 ──────────────────────────────────────────

function seedMasterData_(ss) {
  seedStatusMaster_(ss);
  seedTransitionMaster_(ss);
  seedDocTypeMaster_(ss);
  seedCalendarConfig_(ss);
}

/**
 * Master_Status — 모든 상태값 정의
 * status_key 컬럼명 기준으로 구분
 */
function seedStatusMaster_(ss) {
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MASTER_STATUS);
  if (sheet.getLastRow() > 1) return;

  const rows = [
    // ── case_status ──────────────────────────────
    ['case_status', 'Draft',                    '초안',            '', 1],
    ['case_status', 'Hospital Approved',        '병원 승인',       '', 2],
    ['case_status', 'Supplier Coordination',    '공급 조율',       '', 3],
    ['case_status', 'Shipment In Transit',      '배송 중',         '', 4],
    ['case_status', 'Acceptance Check Pending', '입고 검수 대기',  '', 5],
    ['case_status', 'Acceptance Confirmed',     '입고 확인',       '', 6],
    ['case_status', 'Scheduled',                '시술 예정',       '', 7],
    ['case_status', 'Completed',                '시술 완료',       '', 8],
    ['case_status', 'Follow-up Ongoing',        '추적관찰 중',     '', 9],
    ['case_status', 'Closed',                   '종료',            '', 10],
    ['case_status', 'Cancelled',                '취소',            '', 11],

    // ── lead_status ──────────────────────────────
    ['lead_status', 'New',                      '신규',            '', 1],
    ['lead_status', 'Contacted',                '연락 완료',       '', 2],
    ['lead_status', 'Awaiting Documents',       '자료 수집 중',    '', 3],
    ['lead_status', 'Ready for Hospital Review','검토 요청 가능',  '', 4],
    ['lead_status', 'Converted',                '케이스 전환됨',   '리드 → 케이스 전환 완료', 5],
    ['lead_status', 'Closed - No Progress',     '진행 불가 종료',  '', 6],

    // ── review_status (프로세스 진행 상태) ─────────
    ['review_status', 'Pending',                '심사 대기',       '', 1],
    ['review_status', 'Completed',              '심사 완료',       '', 2],

    // ── review_result (의료 판정 결과) ──────────────
    ['review_result', 'Suitable',               '적합',            '시술 진행 가능', 1],
    ['review_result', 'Not Suitable',           '부적합',          '시술 불가 판정', 2],
    ['review_result', 'Deferred',               '보류',            '추가 정보/검사 후 재심사', 3],
    ['review_result', 'Need More Information',  '추가 정보 필요',  '', 4],

    // ── supplier_status ──────────────────────────
    ['supplier_status', 'Not Requested',        '요청 전',         '', 1],
    ['supplier_status', 'Requested',            '발주 완료',       '', 2],
    ['supplier_status', 'Confirmed',            '공급 확정',       '', 3],
    ['supplier_status', 'In Transit',           '배송 중',         '', 4],
    ['supplier_status', 'Delivered',            '병원 도착',       '', 5],
    ['supplier_status', 'Closed',               '완료',            '', 6],

    // ── acceptance_status ─────────────────────────
    ['acceptance_status', 'Not Started',        '검수 전',         '', 1],
    ['acceptance_status', 'Pending',            '검수 진행 중',    '', 2],
    ['acceptance_status', 'Accepted',           '검수 통과',       '', 3],
    ['acceptance_status', 'Rejected',           '검수 반려',       '', 4],

    // ── payment_status ────────────────────────────
    ['payment_status', 'Not Issued',            '견적 미발행',     '', 1],
    ['payment_status', 'Quote Sent',            '견적 발송',       '', 2],
    ['payment_status', 'Invoice Sent',          '인보이스 발송',   '', 3],
    ['payment_status', 'Partially Paid',        '부분 납입',       '', 4],
    ['payment_status', 'Paid',                  '완납',            '', 5],
    ['payment_status', 'Refunded',              '환불',            '', 6],
  ];

  sheet.getRange(2, 1, rows.length, 5).setValues(rows);
}

/**
 * Master_Status_Transitions — 케이스 상태 전환 규칙
 * Treatment_Preparation 제거, 간소화된 8단계
 */
function seedTransitionMaster_(ss) {
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MASTER_TRANSITIONS);
  if (sheet.getLastRow() > 1) return;

  const rows = [
    ['Cases', 'Draft',                    'Under Hospital Review',    'MSO Admin,MSO Coordinator', '', '병원 심사 요청'],
    ['Cases', 'Draft',                    'Cancelled',                'MSO Admin',                 '', '케이스 취소'],
    ['Cases', 'Under Hospital Review',    'Hospital Approved',        'MSO Admin,Hospital User',   '', '병원 승인'],
    ['Cases', 'Under Hospital Review',    'Draft',                    'MSO Admin,Hospital User',   '', '추가 정보 요청 반려'],
    ['Cases', 'Under Hospital Review',    'Cancelled',                'MSO Admin',                 '', '취소'],
    ['Cases', 'Hospital Approved',        'Supplier Coordination',    'MSO Admin,MSO Coordinator', '', '공급 조율 시작'],
    ['Cases', 'Hospital Approved',        'Cancelled',                'MSO Admin',                 '', '취소'],
    ['Cases', 'Supplier Coordination',    'Shipment In Transit',      'MSO Admin,Supplier User',   '', '출고 확정'],
    ['Cases', 'Shipment In Transit',      'Acceptance Check Pending', 'MSO Admin,MSO Coordinator', '', '병원 도착 확인'],
    ['Cases', 'Acceptance Check Pending', 'Acceptance Confirmed',     'MSO Admin,Hospital User',   '', '입고 검수 통과'],
    ['Cases', 'Acceptance Check Pending', 'Supplier Coordination',    'MSO Admin,Hospital User',   '', '입고 검수 반려 → 재조율'],
    ['Cases', 'Acceptance Confirmed',     'Scheduled',                'MSO Admin,Hospital User',   '', '시술 일정 확정'],
    ['Cases', 'Scheduled',                'Completed',                'MSO Admin,Hospital User',   '', '시술 완료'],
    ['Cases', 'Completed',                'Follow-up Ongoing',        'MSO Admin,MSO Coordinator', '', '추적관찰 시작'],
    ['Cases', 'Follow-up Ongoing',        'Closed',                   'MSO Admin,MSO Coordinator', '', '케이스 종료'],
    ['Cases', 'Completed',                'Closed',                   'MSO Admin',                 '', '추적관찰 없이 종료'],
  ];

  sheet.getRange(2, 1, rows.length, 6).setValues(rows);
}

function seedDocTypeMaster_(ss) {
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MASTER_DOC_TYPES);
  if (sheet.getLastRow() > 1) return;

  const rows = [
    ['PASSPORT',             'Passport / ID',          true,  true,  ''],
    ['CONSENT_PRIVACY',      'Consent - Privacy',       true,  false, ''],
    ['CONSENT_DATA',         'Consent - Data Transfer', true,  false, ''],
    ['MEDICAL_RECORD',       'Medical Record',          false, false, ''],
    ['LAB_RESULT',           'Lab Result',              false, true,  '유효기간 있음'],
    ['IMAGING',              'Imaging (MRI/CT)',        false, false, ''],
    ['HOSPITAL_REVIEW_NOTE', 'Hospital Review Note',    false, false, ''],
    ['QUOTE',                'Quote',                   false, false, ''],
    ['INVOICE',              'Invoice',                 false, false, ''],
    ['PAYMENT_RECEIPT',      'Payment Receipt',         false, false, ''],
    ['SUPPLIER_COA',         'Supplier COA',            false, true,  '배치별 발급'],
    ['SHIPPING_DOC',         'Shipping Document',       false, false, ''],
    ['TEMP_LOG',             'Temperature Log',         false, false, '냉장 운송 시 필수'],
    ['TREATMENT_SUMMARY',    'Treatment Summary',       false, false, ''],
    ['FOLLOWUP_REPORT',      'Follow-up Report',        false, false, ''],
  ];

  sheet.getRange(2, 1, rows.length, 5).setValues(rows);
}

/**
 * Master_Calendar_Config — calendar_id는 실제 Google Calendar ID로 직접 수정
 */
function seedCalendarConfig_(ss) {
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MASTER_CALENDAR);
  if (sheet.getLastRow() > 1) return;

  const rows = [
    ['MSO_MASTER',         'primary', 'MSO Master Calendar',          true],
    ['HOSPITAL_COORD',     '',        'Hospital Coordination',         true],
    ['SUPPLIER_LOGISTICS', '',        'Supplier Logistics',            true],
    ['BILLING_DEADLINE',   '',        'Billing Deadline Reminders',    true],
  ];

  sheet.getRange(2, 1, rows.length, 4).setValues(rows);
}
