const LeadService = {

  getAll: function(filters) {
    let rows = getAllRows(SHEETS.LEADS).map((r, i) => this._toObj(r, i));
    if (filters && filters.status) rows = rows.filter(l => l.status === filters.status);
    return { ok: true, data: rows };
  },

  getById: function(id) {
    const rows = getAllRows(SHEETS.LEADS);
    const idx  = rows.findIndex(r => r[LEAD_COLS.ID] === id);
    if (idx < 0) return { ok: false, error: '리드 없음: ' + id };
    return { ok: true, data: this._toObj(rows[idx], idx) };
  },

  create: function(data) {
    if (!data.name)  throw new Error('이름은 필수입니다');
    if (!data.phone) throw new Error('연락처는 필수입니다');
    const id = genId('L');
    const ts = nowIso();
    appendRow(SHEETS.LEADS, [
      id, data.name, data.phone, data.email || '', data.company || '',
      LEAD_STATUS.NEW, data.source || '', data.notes || '', data.assigned_to || '',
      ts, ts,
    ]);
    return { ok: true, data: { id } };
  },

  update: function(data) {
    const rows = getAllRows(SHEETS.LEADS);
    const idx  = rows.findIndex(r => r[LEAD_COLS.ID] === data.id);
    if (idx < 0) return { ok: false, error: '리드 없음: ' + data.id };
    const row = rows[idx];
    if (data.name        != null) row[LEAD_COLS.NAME]        = data.name;
    if (data.phone       != null) row[LEAD_COLS.PHONE]       = data.phone;
    if (data.email       != null) row[LEAD_COLS.EMAIL]       = data.email;
    if (data.status      != null) row[LEAD_COLS.STATUS]      = data.status;
    if (data.notes       != null) row[LEAD_COLS.NOTES]       = data.notes;
    if (data.assigned_to != null) row[LEAD_COLS.ASSIGNED_TO] = data.assigned_to;
    row[LEAD_COLS.UPDATED_AT] = nowIso();
    updateRow(SHEETS.LEADS, idx, row);
    return { ok: true };
  },

  _toObj: function(r, idx) {
    return {
      _idx:        idx,
      id:          r[LEAD_COLS.ID],
      name:        r[LEAD_COLS.NAME],
      phone:       r[LEAD_COLS.PHONE],
      email:       r[LEAD_COLS.EMAIL],
      company:     r[LEAD_COLS.COMPANY],
      status:      r[LEAD_COLS.STATUS],
      status_ko:   LEAD_STATUS_KO[r[LEAD_COLS.STATUS]] || r[LEAD_COLS.STATUS],
      source:      r[LEAD_COLS.SOURCE],
      notes:       r[LEAD_COLS.NOTES],
      assigned_to: r[LEAD_COLS.ASSIGNED_TO],
      created_at:  r[LEAD_COLS.CREATED_AT],
      updated_at:  r[LEAD_COLS.UPDATED_AT],
    };
  },
};
