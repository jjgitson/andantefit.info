function _ss() {
  // Container-bound: SpreadsheetApp.getActiveSpreadsheet()
  // Standalone:      SpreadsheetApp.openById('SPREADSHEET_ID')
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(name) {
  const sheet = _ss().getSheetByName(name);
  if (!sheet) throw new Error('시트 없음: ' + name);
  return sheet;
}

function getAllRows(sheetName) {
  const sheet = getSheet(sheetName);
  const data  = sheet.getDataRange().getValues();
  return data.length <= 1 ? [] : data.slice(1); // skip header
}

function appendRow(sheetName, row) {
  getSheet(sheetName).appendRow(row);
}

// rowIndex is 0-based index into data rows (not counting header)
function updateRow(sheetName, rowIndex, row) {
  const range = getSheet(sheetName).getRange(rowIndex + 2, 1, 1, row.length);
  range.setValues([row]);
}

function genId(prefix) {
  const ts   = new Date().getTime().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substr(2, 4).toUpperCase();
  return prefix + '-' + ts + rand;
}

function nowIso() {
  return new Date().toISOString();
}
