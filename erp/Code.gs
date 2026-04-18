function doGet() {
  return HtmlService
    .createTemplateFromFile('index')
    .evaluate()
    .setTitle('MSO ERP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Single entry point for all client-side calls
function dispatch(action, payload) {
  try {
    switch (action) {
      case 'leads.getAll':        return LeadService.getAll(payload);
      case 'leads.getById':       return LeadService.getById(payload.id);
      case 'leads.create':        return LeadService.create(payload);
      case 'leads.update':        return LeadService.update(payload);

      case 'cases.getAll':        return CaseService.getAll(payload);
      case 'cases.getById':       return CaseService.getById(payload.id);
      case 'cases.convertLead':   return CaseService.convertFromLead(payload);
      case 'cases.advanceStage':  return CaseService.advanceStage(payload);
      case 'cases.update':        return CaseService.update(payload);

      case 'staff.getAll':        return StaffService.getAll();
      case 'hospitals.getAll':    return HospitalService.getAll();
      case 'tracking.getByCase':  return TrackingService.getByCaseId(payload.case_id);

      default:
        return { ok: false, error: '알 수 없는 액션: ' + action };
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
