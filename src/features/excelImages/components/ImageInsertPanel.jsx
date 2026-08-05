import { useRef, useState } from 'react';
import { useImageInput } from '../hooks/useImageInput';
import ImageEditorModal from './ImageEditorModal';
import './ImageInsertPanel.css';

function ImageInsertPanel({ selectedCell, selectedSheet, onInsert }) {
  const inputRef = useRef(null);
  const [lastInsertedImage, setLastInsertedImage] = useState(null);

  const { image, error, isLoading, handleInputChange, clearImage } =
    useImageInput({
      enablePaste: true,
    });

  const openFileSelector = () => {
    inputRef.current?.click();
  };

  const handleConfirm = editorSettings => {
    const insertedImage = {
      ...image,
      ...editorSettings,
      sheetName: selectedSheet || null,
      cellAddress: selectedCell,
      offsetX: 0,
      offsetY: 0,
      insertedAt: new Date().toISOString(),
    };

    setLastInsertedImage(insertedImage);

    if (typeof onInsert === 'function') {
      onInsert(insertedImage);
    }

    clearImage();
  };

  return (
    <section className='image-insert-panel'>
      <div className='image-insert-panel__header'>
        <div>
          <span className='image-insert-panel__badge'>
            Herramienta de imagen
          </span>

          <h2>Insertar imagen</h2>

          <p>Pega una imagen o selecciónala desde tu computadora.</p>
        </div>

        <div className='image-insert-panel__cell'>
          <span>Celda seleccionada</span>
          <strong>{selectedCell || 'Ninguna'}</strong>
        </div>
      </div>

      <input
        ref={inputRef}
        type='file'
        accept='image/png,image/jpeg,image/webp'
        onChange={handleInputChange}
        hidden
      />

      <div className='image-insert-panel__methods'>
        <button
          type='button'
          className='image-insert-panel__upload'
          onClick={openFileSelector}
          disabled={isLoading}
        >
          <strong>{isLoading ? 'Procesando imagen...' : 'Subir imagen'}</strong>

          <span>Selecciona PNG, JPG, JPEG o WEBP</span>
        </button>

        <div className='image-insert-panel__paste'>
          <div>
            <kbd>Ctrl</kbd>
            <span>+</span>
            <kbd>V</kbd>
          </div>

          <strong>Pegar desde el portapapeles</strong>

          <span>Copia una imagen o captura y pégala en ExcelTool.</span>
        </div>
      </div>

      {error && (
        <p
          className='image-insert-panel__error'
          role='alert'
        >
          {error}
        </p>
      )}

      {lastInsertedImage && (
        <div className='image-insert-panel__success'>
          <div>
            <strong>Imagen preparada</strong>

            <span>
              Celda {lastInsertedImage.cellAddress} · {lastInsertedImage.width}{' '}
              × {lastInsertedImage.height} px
            </span>
          </div>

          <button
            type='button'
            onClick={() => setLastInsertedImage(null)}
          >
            ×
          </button>
        </div>
      )}

      {image && (
        <ImageEditorModal
          image={image}
          selectedCell={selectedCell}
          onCancel={clearImage}
          onConfirm={handleConfirm}
        />
      )}
    </section>
  );
}

export default ImageInsertPanel;
