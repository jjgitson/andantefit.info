const TrackingService = {

  addEntry: function(data) {
    // data: { case_id, stage, status, notes, updated_by }
    const id = genId('T');
    appendRow(SHEETS.TRACKING, [
      id, data.case_id, data.stage, data.status,
      data.notes || '', data.updated_by || '', nowIso(),
    ]);
    return { ok: true, data: { id } };
  },

  getByCaseId: function(case_id) {
    const data = getAllRows(SHEETS.TRACKING)
      .filter(r => r[TRACK_COLS.CASE_ID] === case_id)
      .map(r => ({
        id:         r[TRACK_COLS.ID],
        stage:      r[TRACK_COLS.STAGE],
        stage_ko:   CASE_STATUS_KO[r[TRACK_COLS.STAGE]] || r[TRACK_COLS.STAGE],
        status:     r[TRACK_COLS.STATUS],
        notes:      r[TRACK_COLS.NOTES],
        updated_by: r[TRACK_COLS.BY],
        updated_at: r[TRACK_COLS.AT],
      }))
      .sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
    return { ok: true, data };
  },
};
