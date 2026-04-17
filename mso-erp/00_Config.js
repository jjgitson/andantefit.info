// MSO ERP - 전역 설정 상수
// 스프레드시트 ID는 배포 후 실제 값으로 교체

const CONFIG = {
  SPREADSHEET_ID: SpreadsheetApp.getActiveSpreadsheet().getId(),

  SHEETS: {
    PATIENTS: 'Patients',
    LEADS: 'Leads',
    CASES: 'Cases',
    HOSPITALS: 'Hospitals',
    SUPPLIERS: 'Suppliers',
    MEDICAL_REVIEW: 'Medical_Review',
    SUPPLIER_ORDERS: 'Supplier_Orders',
    APPOINTMENTS: 'Appointments',
    BILLING: 'Billing',
    FOLLOWUPS: 'Followups',
    DOCUMENTS: 'Documents',
    ACTIVITY_LOG: 'Activity_Log',
    AUDIT_LOG: 'Audit_Log',
    MASTER_STATUS: 'Master_Status',
    MASTER_TRANSITIONS: 'Master_Status_Transitions',
    MASTER_DOC_TYPES: 'Master_DocumentTypes',
    MASTER_CALENDAR: 'Master_Calendar_Config',
    DASHBOARD: 'Dashboard_Source',
  },

  ID_PREFIXES: {
    PATIENTS: 'PAT',
    LEADS: 'LEAD',
    CASES: 'CASE',
    SUPPLIER_ORDERS: 'SUPORD',
    BILLING: 'BILL',
    DOCUMENTS: 'DOC',
    AUDIT_LOG: 'AUD',
    ACTIVITY_LOG: 'ACT',
    APPOINTMENTS: 'APT',
    FOLLOWUPS: 'FUP',
    MEDICAL_REVIEW: 'REV',
  },

  CALENDAR_TYPES: {
    MSO_MASTER: 'MSO_MASTER',
    HOSPITAL_COORD: 'HOSPITAL_COORD',
    SUPPLIER_LOGISTICS: 'SUPPLIER_LOGISTICS',
    BILLING_DEADLINE: 'BILLING_DEADLINE',
  },

  CASE_STATUS: {
    DRAFT: 'Draft',
    UNDER_HOSPITAL_REVIEW: 'Under Hospital Review',
    HOSPITAL_APPROVED: 'Hospital Approved',
    SUPPLIER_COORDINATION: 'Supplier Coordination',
    TREATMENT_PREPARATION: 'Treatment Preparation',
    SHIPMENT_IN_TRANSIT: 'Shipment In Transit',
    ACCEPTANCE_CHECK_PENDING: 'Acceptance Check Pending',
    ACCEPTANCE_CONFIRMED: 'Acceptance Confirmed',
    SCHEDULED: 'Scheduled',
    COMPLETED: 'Completed',
    FOLLOWUP_ONGOING: 'Follow-up Ongoing',
    CLOSED: 'Closed',
    CANCELLED: 'Cancelled',
  },

  LEAD_STATUS: {
    NEW: 'New',
    CONTACTED: 'Contacted',
    AWAITING_DOCUMENTS: 'Awaiting Documents',
    READY_FOR_REVIEW: 'Ready for Hospital Review',
    CLOSED_NO_PROGRESS: 'Closed - No Progress',
  },

  REVIEW_RESULT: {
    PENDING: 'Pending',
    NEED_MORE_INFO: 'Need More Information',
    SUITABLE: 'Suitable',
    NOT_SUITABLE: 'Not Suitable',
    DEFERRED: 'Deferred',
  },

  SUPPLIER_STATUS: {
    NOT_REQUESTED: 'Not Requested',
    REQUESTED: 'Requested',
    CONFIRMED: 'Confirmed',
    IN_TRANSIT: 'In Transit',
    DELIVERED: 'Delivered',
    CLOSED: 'Closed',
  },

  ACCEPTANCE_STATUS: {
    NOT_STARTED: 'Not Started',
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
  },

  PAYMENT_STATUS: {
    NOT_ISSUED: 'Not Issued',
    QUOTE_SENT: 'Quote Sent',
    INVOICE_SENT: 'Invoice Sent',
    PARTIALLY_PAID: 'Partially Paid',
    PAID: 'Paid',
    REFUNDED: 'Refunded',
  },

  FOLLOWUP_STAGES: ['D7', 'D14', 'D30', 'D90', 'D180'],

  // 결제 due 알림 기준 (일)
  BILLING_REMINDER_DAYS: 3,

  // 납기 지연 알림 기준 (일)
  SUPPLIER_DELAY_DAYS: 1,

  DRIVE_ROOT_FOLDER_NAME: 'MSO-ERP-Cases',
};
