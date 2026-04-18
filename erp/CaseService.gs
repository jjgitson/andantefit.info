const CaseService = {

  getAll: function(filters) {
    let rows = getAllRows(SHEETS.CASES).map((r, i) => this._toObj(r, i));
    if (filters && filters.status) rows = rows.filter(c => c.status === filters.status);
    return { ok: true, data: rows };
  },

  getById: function(id) {
    const rows = getAllRows(SHEETS.CASES);
    const idx  = rows.findIndex(r => r[CASE_COLS.ID] === id);
    if (idx < 0) return { ok: false, error: '케이스 없음: ' + id };
    return { ok: true, data: this._toObj(rows[idx], idx) };
  },

  // Core conversion: Lead → Case with mandatory MSO staff assignment
  convertFromLead: function(payload) {
    // payload: { lead_id, mso_staff_id, hospital_id?, notes? }
    if (!payload.lead_id)      throw new Error('lead_id가 필요합니다');
    if (!payload.mso_staff_id) throw new Error('MSO 담당자를 지정해주세요');

    // Verify lead exists and is not already converted
    const leadRes = LeadService.getById(payload.lead_id);
    if (!leadRes.ok) throw new Error(leadRes.error);
    if (leadRes.data.status === LEAD_STATUS.CONVERTED) {
      throw new Error('이미 케이스로 전환된 리드입니다');
    }

    // Create the case
    const caseId = genId('C');
    const ts     = nowIso();
    appendRow(SHEETS.CASES, [
      caseId,
      payload.lead_id,
      leadRes.data.name,           // copy patient name from lead
      payload.hospital_id  || '',
      payload.mso_staff_id,
      CASE_STATUS.OPEN,
      payload.notes || '',
      ts, ts,
    ]);

    // Mark lead as converted
    LeadService.update({ id: payload.lead_id, status: LEAD_STATUS.CONVERTED });

    // Seed first tracking entry
    TrackingService.addEntry({
      case_id:    caseId,
      stage:      CASE_STATUS.OPEN,
      status:     'active',
      notes:      '케이스 개설 (리드 전환)',
      updated_by: payload.mso_staff_id,
    });

    return { ok: true, data: { case_id: caseId } };
  },

  // Advance case to next workflow stage
  advanceStage: function(payload) {
    // payload: { id, next_status, notes, updated_by }
    const res = this.update({
      id:     payload.id,
      status: payload.next_status,
      notes:  payload.notes,
    });
    if (!res.ok) return res;

    TrackingService.addEntry({
      case_id:    payload.id,
      stage:      payload.next_status,
      status:     'active',
      notes:      payload.notes || '',
      updated_by: payload.updated_by || '',
    });
    return { ok: true };
  },

  update: function(data) {
    const rows = getAllRows(SHEETS.CASES);
    const idx  = rows.findIndex(r => r[CASE_COLS.ID] === data.id);
    if (idx < 0) return { ok: false, error: '케이스 없음: ' + data.id };
    const row = rows[idx];
    if (data.status       != null) row[CASE_COLS.STATUS]       = data.status;
    if (data.hospital_id  != null) row[CASE_COLS.HOSPITAL_ID]  = data.hospital_id;
    if (data.mso_staff_id != null) row[CASE_COLS.MSO_STAFF_ID] = data.mso_staff_id;
    if (data.notes        != null) row[CASE_COLS.NOTES]        = data.notes;
    row[CASE_COLS.UPDATED_AT] = nowIso();
    updateRow(SHEETS.CASES, idx, row);
    return { ok: true };
  },

  _toObj: function(r, idx) {
    return {
      _idx:         idx,
      id:           r[CASE_COLS.ID],
      lead_id:      r[CASE_COLS.LEAD_ID],
      patient_name: r[CASE_COLS.PATIENT_NAME],
      hospital_id:  r[CASE_COLS.HOSPITAL_ID],
      mso_staff_id: r[CASE_COLS.MSO_STAFF_ID],
      status:       r[CASE_COLS.STATUS],
      status_ko:    CASE_STATUS_KO[r[CASE_COLS.STATUS]] || r[CASE_COLS.STATUS],
      notes:        r[CASE_COLS.NOTES],
      created_at:   r[CASE_COLS.CREATED_AT],
      updated_at:   r[CASE_COLS.UPDATED_AT],
    };
  },
};
