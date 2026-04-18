const StaffService = {
  getAll: function() {
    const data = getAllRows(SHEETS.STAFF)
      .filter(r => String(r[STAFF_COLS.ACTIVE]).toLowerCase() !== 'false')
      .map(r => ({
        id:    r[STAFF_COLS.ID],
        name:  r[STAFF_COLS.NAME],
        email: r[STAFF_COLS.EMAIL],
        role:  r[STAFF_COLS.ROLE],
      }));
    return { ok: true, data };
  },
};
