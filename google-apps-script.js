// ============================================================
// SÉFIRA — Google Apps Script API
// Despliega esto como Web App en Google Apps Script
// ============================================================

const SHEET_PRODUCTOS = 'Productos';
const SHEET_PEDIDOS = 'Pedidos';
const SHEET_CLIENTES = 'Clientes';

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'products';
  let data;

  try {
    switch (action) {
      case 'products':
        data = getSheetData(SHEET_PRODUCTOS);
        break;
      case 'orders':
        data = getSheetData(SHEET_PEDIDOS);
        break;
      case 'clients':
        data = getSheetData(SHEET_CLIENTES);
        break;
      default:
        data = { error: 'Acción no válida' };
    }
  } catch (err) {
    data = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ error: 'JSON inválido' });
  }

  const action = body.action;
  let result;

  try {
    switch (action) {
      case 'saveProduct':
        result = saveRow(SHEET_PRODUCTOS, body.data, 'id');
        break;
      case 'deleteProduct':
        result = deleteRow(SHEET_PRODUCTOS, body.id, 'id');
        break;
      case 'saveOrder':
        result = saveRow(SHEET_PEDIDOS, body.data, 'id');
        break;
      case 'deleteOrder':
        result = deleteRow(SHEET_PEDIDOS, body.id, 'id');
        break;
      case 'saveClient':
        result = saveRow(SHEET_CLIENTES, body.data, 'id');
        break;
      case 'deleteClient':
        result = deleteRow(SHEET_CLIENTES, body.id, 'id');
        break;
      case 'syncAll':
        result = syncAll(body.data);
        break;
      default:
        result = { error: 'Acción no válida: ' + action };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return jsonResponse(result);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0].map(h => h.toString().trim());
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      let val = data[i][j];
      const header = headers[j];

      if (header === 'precio' || header === 'stock' || header === 'totalCompras') {
        val = Number(val) || 0;
      }
      if (header === 'tallas') {
        val = val ? val.toString().split(',').map(s => s.trim()).filter(Boolean) : [];
      }
      row[header] = val;
    }
    if (row.id) rows.push(row);
  }
  return rows;
}

function saveRow(sheetName, rowData, idField) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    const headers = Object.keys(rowData);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#C9A84C')
      .setFontColor('#0E1219');
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().trim());
  const idCol = headers.indexOf(idField);

  if (idCol === -1) return { error: 'Columna ID no encontrada' };

  let targetRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol].toString() === rowData[idField].toString()) {
      targetRow = i + 1;
      break;
    }
  }

  const rowValues = headers.map(h => {
    let val = rowData[h];
    if (val === undefined || val === null) return '';
    if (Array.isArray(val)) return val.join(', ');
    return val;
  });

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    return { success: true, action: 'updated', id: rowData[idField] };
  } else {
    sheet.appendRow(rowValues);
    return { success: true, action: 'created', id: rowData[idField] };
  }
}

function deleteRow(sheetName, id, idField) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { error: 'Hoja no encontrada' };

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().trim());
  const idCol = headers.indexOf(idField);

  if (idCol === -1) return { error: 'Columna ID no encontrada' };

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true, action: 'deleted', id: id };
    }
  }
  return { error: 'Fila no encontrada: ' + id };
}

function syncAll(allData) {
  const results = {};

  if (allData.products) {
    clearAndWrite(SHEET_PRODUCTOS, allData.products);
    results.products = allData.products.length;
  }
  if (allData.orders) {
    clearAndWrite(SHEET_PEDIDOS, allData.orders);
    results.orders = allData.orders.length;
  }
  if (allData.clients) {
    clearAndWrite(SHEET_CLIENTES, allData.clients);
    results.clients = allData.clients.length;
  }

  return { success: true, synced: results };
}

function clearAndWrite(sheetName, rows) {
  if (!rows || rows.length === 0) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  const headers = Object.keys(rows[0]);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clear();
  }

  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#C9A84C')
    .setFontColor('#0E1219');

  const dataRows = rows.map(row =>
    headers.map(h => {
      let val = row[h];
      if (val === undefined || val === null) return '';
      if (Array.isArray(val)) return val.join(', ');
      return val;
    })
  );

  if (dataRows.length > 0) {
    sheet.getRange(2, 1, dataRows.length, headers.length).setValues(dataRows);
  }

  sheet.autoResizeColumns(1, headers.length);
}

function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const productHeaders = ['id', 'nombre', 'categoria', 'precio', 'kilates', 'peso', 'tipoOro', 'descripcion', 'stock', 'tallas', 'imagen', 'estado'];
  const orderHeaders = ['id', 'fecha', 'cliente', 'telefono', 'productos', 'total', 'estado', 'notas'];
  const clientHeaders = ['id', 'nombre', 'telefono', 'email', 'ciudad', 'direccion', 'fechaRegistro', 'totalCompras', 'notas'];

  [
    [SHEET_PRODUCTOS, productHeaders],
    [SHEET_PEDIDOS, orderHeaders],
    [SHEET_CLIENTES, clientHeaders]
  ].forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#C9A84C')
        .setFontColor('#0E1219');
      sheet.autoResizeColumns(1, headers.length);
    }
  });

  SpreadsheetApp.getUi().alert('Hojas creadas: Productos, Pedidos, Clientes');
}
