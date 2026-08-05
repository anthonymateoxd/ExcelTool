import { useEffect } from 'react';
import { useImageEditor } from '../hooks/useImageEditor';
import ImageFrame from './ImageFrame';
import './ImageEditorModal.css';

function ImageEditorModal({ image, selectedCell, onCancel, onConfirm }) {
  const {
    width,
    height,
    fit,
    lockAspectRatio,
    aspectRatio,
    resize,
    changeWidth,
    changeHeight,
    setFit,
    setLockAspectRatio,
    resetEditor,
  } = useImageEditor(image);

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  const handleConfirm = () => {
    onConfirm({
      width,
      height,
      fit,
      lockAspectRatio,
    });
  };

  const imageSource =
    image.source === 'clipboard'
      ? 'Pegada desde el portapapeles'
      : 'Seleccionada desde el equipo';

  return (
    <div
      className='image-editor-backdrop'
      role='presentation'
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <section
        className='image-editor-modal'
        role='dialog'
        aria-modal='true'
        aria-labelledby='image-editor-title'
      >
        <header className='image-editor-modal__header'>
          <div>
            <span className='image-editor-modal__badge'>Editor de imagen</span>

            <h2 id='image-editor-title'>Ajustar imagen</h2>

            <p>
              Arrastra la esquina inferior derecha del marco para decidir el
              tamaño.
            </p>
          </div>

          <button
            type='button'
            className='image-editor-modal__close'
            onClick={onCancel}
            aria-label='Cerrar editor'
          >
            ×
          </button>
        </header>

        <div className='image-editor-modal__information'>
          <div>
            <span>Celda de inicio</span>
            <strong>{selectedCell || 'Ninguna'}</strong>
          </div>

          <div>
            <span>Origen</span>
            <strong>{imageSource}</strong>
          </div>

          <div>
            <span>Imagen original</span>
            <strong>
              {image.width} × {image.height} px
            </strong>
          </div>
        </div>

        <div className='image-editor-modal__stage'>
          <ImageFrame
            image={image}
            width={width}
            height={height}
            fit={fit}
            aspectRatio={aspectRatio}
            lockAspectRatio={lockAspectRatio}
            onResize={resize}
          />
        </div>

        <div className='image-editor-modal__controls'>
          <label>
            <span>Ajuste de imagen</span>

            <select
              value={fit}
              onChange={event => setFit(event.target.value)}
            >
              <option value='contain'>Ajustar imagen completa</option>

              <option value='cover'>Rellenar y recortar</option>
            </select>
          </label>

          <label>
            <span>Ancho</span>

            <div className='image-editor-modal__number'>
              <input
                type='number'
                min='140'
                max='680'
                value={width}
                onChange={event => changeWidth(event.target.value)}
              />

              <span>px</span>
            </div>
          </label>

          <label>
            <span>Alto</span>

            <div className='image-editor-modal__number'>
              <input
                type='number'
                min='90'
                max='420'
                value={height}
                onChange={event => changeHeight(event.target.value)}
              />

              <span>px</span>
            </div>
          </label>

          <label className='image-editor-modal__checkbox'>
            <input
              type='checkbox'
              checked={lockAspectRatio}
              onChange={event => setLockAspectRatio(event.target.checked)}
            />

            <span>Mantener proporción</span>
          </label>
        </div>

        <footer className='image-editor-modal__footer'>
          <button
            type='button'
            className='image-editor-modal__reset'
            onClick={resetEditor}
          >
            Restablecer
          </button>

          <div>
            <button
              type='button'
              className='image-editor-modal__cancel'
              onClick={onCancel}
            >
              Cancelar
            </button>

            <button
              type='button'
              className='image-editor-modal__confirm'
              onClick={handleConfirm}
              disabled={!selectedCell}
            >
              Insertar imagen
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

export default ImageEditorModal;
