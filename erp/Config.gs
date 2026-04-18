// Sheet names — keep English for internal consistency
const SHEETS = {
  LEADS:           'Leads',
  CASES:           'Cases',
  STAFF:           'Staff',
  HOSPITALS:       'Hospitals',
  HOSPITAL_REVIEW: 'HospitalReview',
  SUPPLY:          'Supply',
  BILLING:         'Billing',
  TRACKING:        'Tracking',
};

const LEAD_STATUS = {
  NEW:       'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  CONVERTED: 'converted',
  LOST:      'lost',
};

const LEAD_STATUS_KO = {
  new:       '신규',
  contacted: '연락됨',
  qualified: '검토중',
  converted: '케이스 전환됨',
  lost:      '종료',
};

const CASE_STATUS = {
  OPEN:            'open',
  HOSPITAL_REVIEW: 'hospital_review',
  SUPPLY:          'supply',
  BILLING:         'billing',
  COMPLETE:        'complete',
  CLOSED:          'closed',
};

const CASE_STATUS_KO = {
  open:            '케이스 개설',
  hospital_review: '병원 검토',
  supply:          '공급 관리',
  billing:         '결제/청구',
  complete:        '완료',
  closed:          '종료',
};

// Leads sheet column indices (0-based, row 1 = header)
const LEAD_COLS = {
  ID: 0, NAME: 1, PHONE: 2, EMAIL: 3, COMPANY: 4,
  STATUS: 5, SOURCE: 6, NOTES: 7, ASSIGNED_TO: 8,
  CREATED_AT: 9, UPDATED_AT: 10,
};

// Cases sheet column indices
const CASE_COLS = {
  ID: 0, LEAD_ID: 1, PATIENT_NAME: 2, HOSPITAL_ID: 3,
  MSO_STAFF_ID: 4, STATUS: 5, NOTES: 6,
  CREATED_AT: 7, UPDATED_AT: 8,
};

const STAFF_COLS  = { ID: 0, NAME: 1, EMAIL: 2, ROLE: 3, ACTIVE: 4 };
const HOSP_COLS   = { ID: 0, NAME: 1, CONTACT: 2, PHONE: 3, EMAIL: 4, ADDRESS: 5, STATUS: 6 };
const TRACK_COLS  = { ID: 0, CASE_ID: 1, STAGE: 2, STATUS: 3, NOTES: 4, BY: 5, AT: 6 };
