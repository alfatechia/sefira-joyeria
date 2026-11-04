// ============================================================
// SÉFIRA — Google Apps Script API (simplificado)
// ============================================================

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return jsonOut([]);

    var headers = data[0].map(function(h) { return h.toString().trim(); });
    var rows = [];

    for (var i = 1; i < data.length; i++) {
      var row = {};
      for (var j = 0; j < headers.length; j++) {
        var val = data[i][j];
        var h = headers[j];
        if (h === 'precio' || h === 'costo' || h === 'stock') val = Number(val) || 0;
        if (h === 'tallas' && val) val = val.toString().split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        row[h] = val === undefined || val === null ? '' : val;
      }
      if (row.id) rows.push(row);
    }

    return jsonOut(rows);
  } catch (err) {
    return jsonOut({ error: err.message });
  }
}

function jsonOut(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
