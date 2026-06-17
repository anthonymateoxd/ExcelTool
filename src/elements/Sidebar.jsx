import { useState } from 'react';
import '../styles/Sidebar.css';

function Sidebar({
  fileName,
  selectedCellLabel,
  onStartDictation,
  onDownload,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <aside className='sidebar sidebar--collapsed'>
        <button
          type='button'
          className='sidebar__toggle sidebar__toggle--collapsed'
          onClick={() => setIsCollapsed(false)}
          title='Mostrar panel'
        >
          ☰
        </button>
      </aside>
    );
  }

  return (
    <aside className='sidebar'>
      <div>
        <div className='sidebar__top'>
          <div className='sidebar__header'>
            <h2>ExcelTool</h2>
            <p>Panel rápido</p>
          </div>

          <button
            type='button'
            className='sidebar__toggle'
            onClick={() => setIsCollapsed(true)}
            title='Ocultar panel'
          >
            ›
          </button>
        </div>

        <nav className='sidebar__nav'>
          <label
            htmlFor='excel-file'
            className='sidebar__option'
          >
            Subir archivo
          </label>

          <button
            type='button'
            className='sidebar__option'
            onClick={onStartDictation}
            disabled={!fileName || !selectedCellLabel}
          >
            Micrófono
          </button>

          <button
            type='button'
            className='sidebar__option sidebar__option--primary'
            onClick={onDownload}
            disabled={!fileName}
          >
            Descargar archivo
          </button>
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
