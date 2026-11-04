// ============================================================
// SÉFIRA — Google Apps Script API
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
        row[h] = val === undefined || val === null ? '' : val;
      }
      if (row.id) rows.push(row);
    }

    return jsonOut(rows);
  } catch (err) {
    return jsonOut({ error: err.message });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;

    if (action === 'save') return jsonOut(saveRow(body.data));
    if (action === 'delete') return jsonOut(deleteRow(body.id));
    if (action === 'syncAll') return jsonOut(syncAll(body.data));

    return jsonOut({ error: 'Acción no válida: ' + action });
  } catch (err) {
    return jsonOut({ error: err.message });
  }
}

function jsonOut(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveRow(rowData) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return h.toString().trim(); });
  var idCol = headers.indexOf('id');
  if (idCol === -1) return { error: 'Columna id no encontrada' };

  var targetRow = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol].toString() === rowData.id.toString()) {
      targetRow = i + 1;
      break;
    }
  }

  var rowValues = headers.map(function(h) {
    var val = rowData[h];
    if (val === undefined || val === null) return '';
    return val;
  });

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    return { success: true, action: 'updated', id: rowData.id };
  } else {
    sheet.appendRow(rowValues);
    return { success: true, action: 'created', id: rowData.id };
  }
}

function deleteRow(id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return h.toString().trim(); });
  var idCol = headers.indexOf('id');

  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true, action: 'deleted', id: id };
    }
  }
  return { error: 'No encontrado: ' + id };
}

function syncAll(rows) {
  if (!rows || rows.length === 0) return { error: 'Sin datos' };

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { return h.toString().trim(); });

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
  }

  var dataRows = rows.map(function(row) {
    return headers.map(function(h) {
      var val = row[h];
      if (val === undefined || val === null) return '';
      return val;
    });
  });

  if (dataRows.length > 0) {
    sheet.getRange(2, 1, dataRows.length, headers.length).setValues(dataRows);
  }

  return { success: true, synced: dataRows.length };
}
