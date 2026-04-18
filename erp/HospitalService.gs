const HospitalService = {
  getAll: function() {
    const data = getAllRows(SHEETS.HOSPITALS)
      .filter(r => r[HOSP_COLS.STATUS] === 'active')
      .map(r => ({
        id:      r[HOSP_COLS.ID],
        name:    r[HOSP_COLS.NAME],
        contact: r[HOSP_COLS.CONTACT],
        phone:   r[HOSP_COLS.PHONE],
        email:   r[HOSP_COLS.EMAIL],
        address: r[HOSP_COLS.ADDRESS],
      }));
    return { ok: true, data };
  },
};
