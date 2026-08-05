import { useState } from 'react';

import subirArchivoIcon from '../images/Subir_archivo.png';
import microfonoIcon from '../images/Microfono.png';
import descargarArchivoIcon from '../images/Descargar_archivo.png';

import '../styles/Sidebar.css';

function Sidebar({
  fileName,
  selectedCellLabel,
  onStartDictation,
  onDownload,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
      <div className='sidebar__content'>
        <div className='sidebar__top'>
          <div className='sidebar__header'>
            <h2>ExcelTool</h2>
            <p>Panel rápido</p>
          </div>

          <button
            type='button'
            className='sidebar__toggle'
            onClick={() => setIsCollapsed(previous => !previous)}
            aria-label={
              isCollapsed ? 'Expandir panel lateral' : 'Minimizar panel lateral'
            }
            title={
              isCollapsed ? 'Expandir panel lateral' : 'Minimizar panel lateral'
            }
          >
            {isCollapsed ? '‹' : '›'}
          </button>
        </div>

        <nav className='sidebar__nav'>
          <label
            htmlFor='excel-file'
            className='sidebar__option'
            title='Subir archivo'
          >
            <img
              src={subirArchivoIcon}
              alt=''
              className='sidebar__option-icon'
              aria-hidden='true'
            />

            <span className='sidebar__option-text'>Subir archivo</span>
          </label>

          <button
            type='button'
            className='sidebar__option'
            onClick={onStartDictation}
            disabled={!fileName || !selectedCellLabel}
            title={
              !fileName
                ? 'Primero debes subir un archivo'
                : !selectedCellLabel
                  ? 'Selecciona una celda'
                  : 'Activar micrófono'
            }
          >
            <img
              src={microfonoIcon}
              alt=''
              className='sidebar__option-icon'
              aria-hidden='true'
            />

            <span className='sidebar__option-text'>Micrófono</span>
          </button>

          <button
            type='button'
            className='sidebar__option sidebar__option--primary'
            onClick={onDownload}
            disabled={!fileName}
            title={
              fileName ? 'Descargar archivo' : 'Primero debes subir un archivo'
            }
          >
            <img
              src={descargarArchivoIcon}
              alt=''
              className='sidebar__option-icon'
              aria-hidden='true'
            />

            <span className='sidebar__option-text'>Descargar archivo</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
