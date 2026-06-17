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

  const extension = file.name.split('.').pop().toLowerCase();

  if (!['xlsx', 'xls'].includes(extension)) {
    throw new Error('El archivo debe ser .xlsx o .xls.');
  }

  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: 'array',
  });

  const sheetNames = workbook.SheetNames;

  const sheetsData = sheetNames.reduce((accumulator, sheetName) => {
    const worksheet = workbook.Sheets[sheetName];

    accumulator[sheetName] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
    });

    return accumulator;
  }, {});

  return {
    sheetNames,
    sheetsData,
  };
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
