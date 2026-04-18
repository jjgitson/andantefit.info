// MSO ERP - 전역 설정 상수

const CONFIG = {
  SPREADSHEET_ID: SpreadsheetApp.getActiveSpreadsheet().getId(),

  // ─── 시트 이름 (총 19개, 복수형 통일) ──────────────────────────
  SHEETS: {
    USERS:                   'Users',
    PATIENTS:                'Patients',
    LEADS:                   'Leads',
    CASES:                   'Cases',
    HOSPITALS:               'Hospitals',
    SUPPLIERS:               'Suppliers',
    MEDICAL_REVIEWS:         'Medical_Reviews',
    SUPPLIER_ORDERS:         'Supplier_Orders',
    ACCEPTANCE_CHECKS:       'Acceptance_Checks',
    APPOINTMENTS:            'Appointments',
    BILLING:                 'Billing',
    FOLLOWUPS:               'Followups',
    DOCUMENTS:               'Documents',
    ACTIVITY_LOG:            'Activity_Log',
    AUDIT_LOG:               'Audit_Log',
    MASTER_STATUS:           'Master_Status',
    MASTER_TRANSITIONS:      'Master_Status_Transitions',
    MASTER_DOC_TYPES:        'Master_DocumentTypes',
    MASTER_CALENDAR:         'Master_Calendar_Config',
  },

  // ─── ID 접두사 ────────────────────────────────────────────────
  ID_PREFIXES: {
    PATIENTS:          'PAT',
    LEADS:             'LEAD',
    CASES:             'CASE',
    MEDICAL_REVIEWS:   'REV',
    SUPPLIER_ORDERS:   'ORD',
    ACCEPTANCE_CHECKS: 'ACC',
    APPOINTMENTS:      'APT',
    BILLING:           'BILL',
    FOLLOWUPS:         'FUP',
    DOCUMENTS:         'DOC',
    ACTIVITY_LOG:      'ACT',
    AUDIT_LOG:         'AUD',
  },

  // ─── 캘린더 유형 키 ──────────────────────────────────────────
  CALENDAR_TYPES: {
    MSO_MASTER:          'MSO_MASTER',
    HOSPITAL_COORD:      'HOSPITAL_COORD',
    SUPPLIER_LOGISTICS:  'SUPPLIER_LOGISTICS',
    BILLING_DEADLINE:    'BILLING_DEADLINE',
  },

  // ─── 상태값 (Master_Status 마스터 테이블과 동기화) ─────────────
  // 아래 값을 변경할 경우 Master_Status 시트도 함께 수정

  CASE_STATUS: {
    DRAFT:                    'Draft',
    HOSPITAL_APPROVED:        'Hospital Approved',
    SUPPLIER_COORDINATION:    'Supplier Coordination',
    SHIPMENT_IN_TRANSIT:      'Shipment In Transit',
    ACCEPTANCE_CHECK_PENDING: 'Acceptance Check Pending',
    ACCEPTANCE_CONFIRMED:     'Acceptance Confirmed',
    SCHEDULED:                'Scheduled',
    COMPLETED:                'Completed',
    FOLLOWUP_ONGOING:         'Follow-up Ongoing',
    CLOSED:                   'Closed',
    CANCELLED:                'Cancelled',
  },

  LEAD_STATUS: {
    NEW:                 'New',
    CONTACTED:           'Contacted',
    AWAITING_DOCUMENTS:  'Awaiting Documents',
    READY_FOR_REVIEW:    'Ready for Hospital Review',
    CONVERTED:           'Converted',
    CLOSED_NO_PROGRESS:  'Closed - No Progress',
  },

  // Medical_Reviews.review_status — 프로세스 진행 상태
  REVIEW_STATUS: {
    PENDING:   'Pending',
    COMPLETED: 'Completed',
  },

  // Medical_Reviews.review_result — 의료적 판정 결과
  REVIEW_RESULT: {
    SUITABLE:          'Suitable',
    NOT_SUITABLE:      'Not Suitable',
    DEFERRED:          'Deferred',
    NEED_MORE_INFO:    'Need More Information',
  },

  SUPPLIER_STATUS: {
    NOT_REQUESTED: 'Not Requested',
    REQUESTED:     'Requested',
    CONFIRMED:     'Confirmed',
    IN_TRANSIT:    'In Transit',
    DELIVERED:     'Delivered',
    CLOSED:        'Closed',
  },

  ACCEPTANCE_STATUS: {
    NOT_STARTED: 'Not Started',
    PENDING:     'Pending',
    ACCEPTED:    'Accepted',
    REJECTED:    'Rejected',
  },

  PAYMENT_STATUS: {
    NOT_ISSUED:      'Not Issued',
    QUOTE_SENT:      'Quote Sent',
    INVOICE_SENT:    'Invoice Sent',
    PARTIALLY_PAID:  'Partially Paid',
    PAID:            'Paid',
    REFUNDED:        'Refunded',
  },

  FOLLOWUP_STAGES: ['D7', 'D14', 'D30', 'D90', 'D180'],

  BILLING_REMINDER_DAYS:  3,
  SUPPLIER_DELAY_DAYS:    1,
  DRIVE_ROOT_FOLDER_NAME: 'MSO-ERP-Cases',

  // Google OAuth 클라이언트 ID (GSI 외부 사용자 인증용)
  // GCP Console → API 및 서비스 → 사용자 인증 정보 → OAuth 클라이언트 ID
  // 웹 애플리케이션 유형, Apps Script 배포 URL을 승인된 출처에 추가
  GOOGLE_CLIENT_ID: '',
};
