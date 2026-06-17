import { useCallback, useMemo, useState } from 'react';
import Sidebar from '../elements/Sidebar';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import {
  downloadExcelFile,
  getCellAddress,
  getColumnLabel,
  readExcelFile,
} from '../utils/excelUtils';
import '../styles/Homepage.css';

function Homepage() {
  const [fileName, setFileName] = useState('');
  const [sheetNames, setSheetNames] = useState([]);
  const [sheetsData, setSheetsData] = useState({});
  const [selectedSheet, setSelectedSheet] = useState('');
  const [selectedCell, setSelectedCell] = useState(null);
  const [status, setStatus] = useState('Esperando archivo');
  const [isLoading, setIsLoading] = useState(false);

  const currentSheetData = useMemo(() => {
    if (!selectedSheet) return [];

    return sheetsData[selectedSheet] || [];
  }, [selectedSheet, sheetsData]);

  const selectedCellLabel = useMemo(() => {
    if (!selectedCell) return '';

    return getCellAddress(selectedCell.row, selectedCell.column);
  }, [selectedCell]);

  const selectedCellValue = useMemo(() => {
    if (!selectedSheet || !selectedCell) return '';

    return (
      sheetsData[selectedSheet]?.[selectedCell.row]?.[selectedCell.column] ?? ''
    );
  }, [selectedSheet, selectedCell, sheetsData]);

  const maxColumns = useMemo(() => {
    const realColumns = currentSheetData.reduce((max, row) => {
      return Math.max(max, row.length);
    }, 0);

    return Math.max(realColumns, 8);
  }, [currentSheetData]);

  const visibleRows = useMemo(() => {
    return Math.max(currentSheetData.length, 12);
  }, [currentSheetData]);

  const processFile = async file => {
    try {
      setIsLoading(true);
      setStatus(`Leyendo archivo: ${file.name || 'archivo de Excel'}...`);

      const result = await readExcelFile(file);

      if (!result.sheetNames.length) {
        throw new Error('El archivo no contiene hojas de Excel disponibles.');
      }

      setFileName(file.name || 'archivo.xlsx');
      setSheetNames(result.sheetNames);
      setSheetsData(result.sheetsData);
      setSelectedSheet(result.sheetNames[0]);
      setSelectedCell(null);

      setStatus(`Archivo cargado: ${file.name || 'archivo de Excel'}`);

      return true;
    } catch (error) {
      console.error('Error al procesar el archivo:', error);

      setStatus(
        error instanceof Error
          ? error.message
          : 'No se pudo leer el archivo seleccionado.',
      );

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async event => {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) return;

    try {
      await processFile(file);
    } finally {
      input.value = '';
    }
  };

  const handleDrop = event => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (!file) return;

    processFile(file);
  };

  const handleDragOver = event => {
    event.preventDefault();
  };

  const handleSelectSheet = sheetName => {
    setSelectedSheet(sheetName);
    setSelectedCell(null);
    setStatus(`Hoja seleccionada: ${sheetName}`);
  };

  const handleSelectCell = (rowIndex, columnIndex) => {
    setSelectedCell({
      row: rowIndex,
      column: columnIndex,
    });

    setStatus(`Celda seleccionada: ${getCellAddress(rowIndex, columnIndex)}`);
  };

  const updateSelectedCell = useCallback(
    value => {
      if (!selectedSheet || !selectedCell) return;

      setSheetsData(previousSheetsData => {
        const nextSheetsData = { ...previousSheetsData };

        const updatedRows = (nextSheetsData[selectedSheet] || []).map(row => [
          ...row,
        ]);

        while (updatedRows.length <= selectedCell.row) {
          updatedRows.push([]);
        }

        while (updatedRows[selectedCell.row].length <= selectedCell.column) {
          updatedRows[selectedCell.row].push('');
        }

        updatedRows[selectedCell.row][selectedCell.column] = value;

        nextSheetsData[selectedSheet] = updatedRows;

        return nextSheetsData;
      });
    },
    [selectedSheet, selectedCell],
  );

  const handleSpeechResult = useCallback(
    text => {
      if (!selectedCell) {
        setStatus('El dictado fue recibido, pero no hay celda seleccionada.');
        return;
      }

      updateSelectedCell(text);
      setStatus(`Texto agregado en la celda ${selectedCellLabel}`);
    },
    [selectedCell, selectedCellLabel, updateSelectedCell],
  );

  const {
    isSupported,
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onResult: handleSpeechResult,
    language: 'es-MX',
  });

  const handleStartDictation = () => {
    if (!selectedCell) {
      setStatus('Selecciona una celda antes de activar el micrófono.');
      return;
    }

    setStatus(`Escuchando para escribir en la celda ${selectedCellLabel}...`);
    startListening();
  };

  const handleDownload = () => {
    if (!sheetNames.length) {
      setStatus('Primero debes subir un archivo de Excel.');
      return;
    }

    downloadExcelFile({
      sheetNames,
      sheetsData,
      fileName,
    });

    setStatus('Archivo modificado descargado correctamente.');
  };

  return (
    <div className='homepage'>
      <main className='homepage__content'>
        <section
          className={`upload-section ${fileName ? 'upload-section--loaded' : ''}`}
        >
          <input
            id='excel-file'
            type='file'
            accept='.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'
            className='upload-box__input'
            onChange={handleFileChange}
          />

          {!fileName && (
            <>
              <div className='upload-section__header'>
                <span className='upload-section__badge'>Herramienta Excel</span>

                <h1>Dictado inteligente para Excel</h1>

                <p>
                  Sube un archivo de Excel, selecciona una hoja, elige una celda
                  y escribe contenido usando el micrófono.
                </p>
              </div>

              <label
                htmlFor='excel-file'
                className='upload-box'
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className='upload-box__icon'>XLS</div>

                <div className='upload-box__text'>
                  <h2>
                    {isLoading ? 'Leyendo archivo...' : 'Seleccionar archivo'}
                  </h2>
                  <p>Haz clic aquí o arrastra tu archivo de Excel</p>
                  <small>Formatos permitidos: .xlsx, .xls</small>
                </div>
              </label>
            </>
          )}

          {status && status !== 'Esperando archivo' && (
            <div
              className={
                status.toLowerCase().includes('error') ||
                status.toLowerCase().includes('no se pudo') ||
                status.toLowerCase().includes('vacío')
                  ? 'file-status file-status--error'
                  : 'file-status'
              }
            >
              {status}
            </div>
          )}

          {fileName && (
            <div className='workbook-panel'>
              <div>
                <span>Archivo cargado</span>
                <strong>{fileName}</strong>
              </div>

              <button
                type='button'
                className='download-button'
                onClick={handleDownload}
              >
                Descargar Excel modificado
              </button>
            </div>
          )}

          {selectedSheet && (
            <section className='sheet-workspace'>
              {/* Aquí continúa todo tu Excel */}
            </section>
          )}

          {fileName && (
            <div className='workbook-panel'>
              <div>
                <span>Archivo cargado</span>
                <strong>{fileName}</strong>
              </div>

              <button
                type='button'
                className='download-button'
                onClick={handleDownload}
              >
                Descargar Excel modificado
              </button>
            </div>
          )}

          {selectedSheet && (
            <section className='sheet-workspace'>
              <section className='sheet-workspace'>
                <div className='sheet-toolbar'>
                  <div>
                    <span>Hoja activa</span>
                    <select
                      value={selectedSheet}
                      onChange={event => handleSelectSheet(event.target.value)}
                    >
                      {sheetNames.map(sheetName => (
                        <option
                          key={sheetName}
                          value={sheetName}
                        >
                          {sheetName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='dictation-panel'>
                    <div>
                      <span>Celda seleccionada</span>
                      <strong>{selectedCellLabel || 'Ninguna'}</strong>
                    </div>

                    <button
                      type='button'
                      className='microphone-button'
                      onClick={handleStartDictation}
                      disabled={!isSupported || isListening}
                    >
                      {isListening ? 'Escuchando...' : 'Activar micrófono'}
                    </button>

                    {isListening && (
                      <button
                        type='button'
                        className='stop-button'
                        onClick={stopListening}
                      >
                        Detener
                      </button>
                    )}
                  </div>
                </div>

                {selectedCell && (
                  <div className='cell-editor'>
                    <label htmlFor='selected-cell-value'>
                      Contenido de la celda {selectedCellLabel}
                    </label>

                    <input
                      id='selected-cell-value'
                      type='text'
                      value={selectedCellValue}
                      onChange={event => updateSelectedCell(event.target.value)}
                      placeholder='Contenido de la celda'
                    />
                  </div>
                )}

                {!isSupported && (
                  <p className='warning-message'>
                    Tu navegador no soporta reconocimiento de voz. Usa Chrome o
                    Edge para esta función.
                  </p>
                )}

                {speechError && (
                  <p className='warning-message'>{speechError}</p>
                )}

                {transcript && (
                  <p className='transcript-message'>
                    Último dictado: <strong>{transcript}</strong>
                  </p>
                )}

                <div className='excel-table-wrapper'>
                  <table className='excel-table'>
                    <thead>
                      <tr>
                        <th className='excel-table__corner'></th>

                        {Array.from({ length: maxColumns }).map(
                          (_, columnIndex) => (
                            <th key={columnIndex}>
                              {getColumnLabel(columnIndex)}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {Array.from({ length: visibleRows }).map(
                        (_, rowIndex) => {
                          const row = currentSheetData[rowIndex] || [];

                          return (
                            <tr key={rowIndex}>
                              <th>{rowIndex + 1}</th>

                              {Array.from({ length: maxColumns }).map(
                                (_, columnIndex) => {
                                  const cellValue = row[columnIndex] ?? '';
                                  const isSelected =
                                    selectedCell?.row === rowIndex &&
                                    selectedCell?.column === columnIndex;

                                  return (
                                    <td
                                      key={`${rowIndex}-${columnIndex}`}
                                      className={
                                        isSelected ? 'selected-cell' : ''
                                      }
                                      onClick={() =>
                                        handleSelectCell(rowIndex, columnIndex)
                                      }
                                    >
                                      {String(cellValue) || '\u00A0'}
                                    </td>
                                  );
                                },
                              )}
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </section>
          )}
        </section>
      </main>

      <Sidebar
        fileName={fileName}
        selectedCellLabel={selectedCellLabel}
        onStartDictation={handleStartDictation}
        onDownload={handleDownload}
      />
    </div>
  );
}

export default Homepage;
