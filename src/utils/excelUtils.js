import * as XLSX from 'xlsx';

export function getColumnLabel(index) {
  let label = '';
  let number = index + 1;

  while (number > 0) {
    const remainder = (number - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    number = Math.floor((number - 1) / 26);
  }

  return label;
}

export function getCellAddress(rowIndex, columnIndex) {
  return `${getColumnLabel(columnIndex)}${rowIndex + 1}`;
}

export async function readExcelFile(file) {
  if (!file) {
    throw new Error('No se seleccionó ningún archivo.');
  }

  const fileName = file.name || '';
  const extension = fileName.includes('.')
    ? fileName.split('.').pop().toLowerCase()
    : '';

  const validExtensions = ['xlsx', 'xls'];

  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/octet-stream',
    '',
  ];

  const hasValidExtension = validExtensions.includes(extension);
  const hasValidMimeType = validMimeTypes.includes(file.type);

  /*
   * Algunos proveedores de Android no entregan correctamente
   * la extensión o usan application/octet-stream.
   */
  if (!hasValidExtension && !hasValidMimeType) {
    throw new Error(
      `El archivo seleccionado no parece ser un Excel. Nombre: ${
        fileName || 'desconocido'
      }`,
    );
  }

  if (file.size === 0) {
    throw new Error(
      'Google Drive devolvió un archivo vacío. Espera que termine la descarga e inténtalo nuevamente.',
    );
  }

  let buffer;

  try {
    buffer = await file.arrayBuffer();
  } catch {
    buffer = await readFileWithFileReader(file);
  }

  if (!buffer || buffer.byteLength === 0) {
    throw new Error('El archivo no contiene datos o no pudo descargarse.');
  }

  let workbook;

  try {
    workbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: true,
    });
  } catch (error) {
    console.error('Error de XLSX:', error);

    throw new Error(
      'No se pudo interpretar el archivo. Verifica que sea un Excel .xlsx o .xls real.',
    );
  }

  if (!workbook.SheetNames?.length) {
    throw new Error('El archivo no contiene hojas de Excel.');
  }

  const sheetNames = workbook.SheetNames;

  const sheetsData = sheetNames.reduce((accumulator, sheetName) => {
    const worksheet = workbook.Sheets[sheetName];

    accumulator[sheetName] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    return accumulator;
  }, {});

  return {
    sheetNames,
    sheetsData,
  };
}

function readFileWithFileReader(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      resolve(event.target?.result);
    };

    reader.onerror = () => {
      reject(new Error('El teléfono no pudo leer el archivo seleccionado.'));
    };

    reader.onabort = () => {
      reject(new Error('La lectura del archivo fue cancelada.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export function downloadExcelFile({ sheetNames, sheetsData, fileName }) {
  const workbook = XLSX.utils.book_new();

  sheetNames.forEach(sheetName => {
    const data = sheetsData[sheetName] || [];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  const cleanName = fileName
    ? fileName.replace(/\.(xlsx|xls)$/i, '')
    : 'archivo_excel';

  XLSX.writeFile(workbook, `${cleanName}_modificado.xlsx`);
}
