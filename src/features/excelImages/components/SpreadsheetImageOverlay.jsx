import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './SpreadsheetImageOverlay.css';

const RESIZE_LIMITS = Object.freeze({
  minWidth: 80,
  minHeight: 60,
  maxWidth: 1200,
  maxHeight: 900,
});

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function SpreadsheetImageOverlay({
  images = [],
  selectedSheet,
  selectedImageId,
  gridRef,
  onSelectImage,
  onUpdateImage,
  onDeleteImage,
}) {
  const [positions, setPositions] = useState({});
  const [resizeDraft, setResizeDraft] = useState(null);
  const [moveDraft, setMoveDraft] = useState(null);

  const resizeStateRef = useRef(null);
  const resizeDraftRef = useRef(null);

  const moveStateRef = useRef(null);
  const moveDraftRef = useRef(null);

  const calculatePositions = useCallback(() => {
    const gridElement = gridRef.current;

    if (!gridElement) {
      setPositions({});
      return;
    }

    const gridRect = gridElement.getBoundingClientRect();
    const nextPositions = {};

    images
      .filter(image => image.sheetName === selectedSheet)
      .forEach(image => {
        const targetCell = gridElement.querySelector(
          `[data-cell-address="${image.cellAddress}"]`,
        );

        if (!targetCell) {
          return;
        }

        const cellRect = targetCell.getBoundingClientRect();

        nextPositions[image.id] = {
          left: cellRect.left - gridRect.left + gridElement.scrollLeft,

          top: cellRect.top - gridRect.top + gridElement.scrollTop,
        };
      });

    setPositions(nextPositions);
  }, [gridRef, images, selectedSheet]);

  useLayoutEffect(() => {
    const gridElement = gridRef.current;

    if (!gridElement) {
      return undefined;
    }

    const animationFrame = requestAnimationFrame(calculatePositions);

    const handleLayoutChange = () => {
      calculatePositions();
    };

    window.addEventListener('resize', handleLayoutChange);

    gridElement.addEventListener('scroll', handleLayoutChange);

    const resizeObserver = new ResizeObserver(handleLayoutChange);

    resizeObserver.observe(gridElement);

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener('resize', handleLayoutChange);

      gridElement.removeEventListener('scroll', handleLayoutChange);

      resizeObserver.disconnect();
    };
  }, [calculatePositions, gridRef]);

  /*
   * Movimiento de la imagen
   */

  const handleMoveStart = (event, image) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    event.currentTarget.setPointerCapture(event.pointerId);

    moveStateRef.current = {
      pointerId: event.pointerId,
      imageId: image.id,

      startX: event.clientX,
      startY: event.clientY,

      startOffsetX: image.offsetX || 0,
      startOffsetY: image.offsetY || 0,
    };

    moveDraftRef.current = null;
    setMoveDraft(null);

    onSelectImage?.(image.id);
  };

  const handleMove = event => {
    const moveState = moveStateRef.current;

    if (!moveState || moveState.pointerId !== event.pointerId) {
      return;
    }

    const movementX = event.clientX - moveState.startX;

    const movementY = event.clientY - moveState.startY;

    const nextDraft = {
      imageId: moveState.imageId,

      offsetX: Math.round(moveState.startOffsetX + movementX),

      offsetY: Math.round(moveState.startOffsetY + movementY),
    };

    moveDraftRef.current = nextDraft;
    setMoveDraft(nextDraft);
  };

  const handleMoveFinish = event => {
    const moveState = moveStateRef.current;
    const currentDraft = moveDraftRef.current;

    if (!moveState || moveState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (currentDraft && currentDraft.imageId === moveState.imageId) {
      onUpdateImage?.(moveState.imageId, {
        offsetX: currentDraft.offsetX,
        offsetY: currentDraft.offsetY,
      });
    }

    moveStateRef.current = null;
    moveDraftRef.current = null;

    setMoveDraft(null);
  };

  /*
   * Redimensionamiento
   */

  const handleResizeStart = (event, image, resizeCorner) => {
    event.preventDefault();
    event.stopPropagation();

    event.currentTarget.setPointerCapture(event.pointerId);

    const startWidth = image.width;
    const startHeight = image.height;

    resizeStateRef.current = {
      pointerId: event.pointerId,
      imageId: image.id,
      corner: resizeCorner,

      startX: event.clientX,
      startY: event.clientY,

      startWidth,
      startHeight,

      startOffsetX: image.offsetX || 0,
      startOffsetY: image.offsetY || 0,

      aspectRatio: startHeight > 0 ? startWidth / startHeight : 1,

      lockAspectRatio: image.lockAspectRatio !== false,
    };

    resizeDraftRef.current = null;
    setResizeDraft(null);

    onSelectImage?.(image.id);
  };

  const handleResizeMove = event => {
    const resizeState = resizeStateRef.current;

    if (!resizeState || resizeState.pointerId !== event.pointerId) {
      return;
    }

    const { minWidth, minHeight, maxWidth, maxHeight } = RESIZE_LIMITS;

    const movementX = event.clientX - resizeState.startX;

    const movementY = event.clientY - resizeState.startY;

    const growsRight = resizeState.corner.includes('e');

    const growsDown = resizeState.corner.includes('s');

    const horizontalChange = growsRight ? movementX : -movementX;

    const verticalChange = growsDown ? movementY : -movementY;

    let newWidth;
    let newHeight;

    if (resizeState.lockAspectRatio) {
      const widthScale =
        (resizeState.startWidth + horizontalChange) / resizeState.startWidth;

      const heightScale =
        (resizeState.startHeight + verticalChange) / resizeState.startHeight;

      let scale =
        Math.abs(widthScale - 1) >= Math.abs(heightScale - 1)
          ? widthScale
          : heightScale;

      const minimumScale = Math.max(
        minWidth / resizeState.startWidth,
        minHeight / resizeState.startHeight,
      );

      const maximumScale = Math.min(
        maxWidth / resizeState.startWidth,
        maxHeight / resizeState.startHeight,
      );

      scale = clamp(scale, minimumScale, maximumScale);

      newWidth = Math.round(resizeState.startWidth * scale);

      newHeight = Math.round(resizeState.startHeight * scale);
    } else {
      newWidth = clamp(
        Math.round(resizeState.startWidth + horizontalChange),
        minWidth,
        maxWidth,
      );

      newHeight = clamp(
        Math.round(resizeState.startHeight + verticalChange),
        minHeight,
        maxHeight,
      );
    }

    let newOffsetX = resizeState.startOffsetX;
    let newOffsetY = resizeState.startOffsetY;

    if (resizeState.corner.includes('w')) {
      newOffsetX =
        resizeState.startOffsetX + (resizeState.startWidth - newWidth);
    }

    if (resizeState.corner.includes('n')) {
      newOffsetY =
        resizeState.startOffsetY + (resizeState.startHeight - newHeight);
    }

    const nextDraft = {
      imageId: resizeState.imageId,
      width: newWidth,
      height: newHeight,
      offsetX: Math.round(newOffsetX),
      offsetY: Math.round(newOffsetY),
    };

    resizeDraftRef.current = nextDraft;
    setResizeDraft(nextDraft);
  };

  const handleResizeFinish = event => {
    const resizeState = resizeStateRef.current;
    const currentDraft = resizeDraftRef.current;

    if (!resizeState || resizeState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (currentDraft && currentDraft.imageId === resizeState.imageId) {
      onUpdateImage?.(resizeState.imageId, {
        width: currentDraft.width,
        height: currentDraft.height,
        offsetX: currentDraft.offsetX,
        offsetY: currentDraft.offsetY,
      });
    }

    resizeStateRef.current = null;
    resizeDraftRef.current = null;

    setResizeDraft(null);
  };

  const gridElement = gridRef.current;

  if (!gridElement) {
    return null;
  }

  const visibleImages = images.filter(
    image => image.sheetName === selectedSheet,
  );

  return createPortal(
    <>
      {visibleImages.map(image => {
        const position = positions[image.id];

        if (!position) {
          return null;
        }

        const isSelected = image.id === selectedImageId;

        let currentImage = image;

        if (resizeDraft?.imageId === image.id) {
          currentImage = {
            ...image,
            ...resizeDraft,
          };
        }

        if (moveDraft?.imageId === image.id) {
          currentImage = {
            ...image,
            ...moveDraft,
          };
        }

        const offsetX = currentImage.offsetX || 0;
        const offsetY = currentImage.offsetY || 0;

        const isMoving = moveDraft?.imageId === image.id;

        return (
          <div
            key={image.id}
            className={[
              'spreadsheet-image-overlay',

              isSelected ? 'spreadsheet-image-overlay--selected' : '',

              isMoving ? 'spreadsheet-image-overlay--moving' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            data-spreadsheet-image='true'
            data-image-id={image.id}
            style={{
              left: `${position.left + offsetX}px`,

              top: `${position.top + offsetY}px`,

              width: `${currentImage.width}px`,
              height: `${currentImage.height}px`,
            }}
            onPointerDown={event => handleMoveStart(event, currentImage)}
            onPointerMove={handleMove}
            onPointerUp={handleMoveFinish}
            onPointerCancel={handleMoveFinish}
          >
            <img
              src={image.dataUrl}
              alt={image.name}
              draggable='false'
              style={{
                objectFit: image.fit || 'contain',
              }}
            />

            {isSelected && (
              <>
                <div className='spreadsheet-image-overlay__toolbar'>
                  <span>
                    {currentImage.width} × {currentImage.height} px
                  </span>

                  <button
                    type='button'
                    title='Eliminar imagen'
                    aria-label='Eliminar imagen'
                    onPointerDown={event => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={event => {
                      event.stopPropagation();
                      onDeleteImage?.(image.id);
                    }}
                  >
                    Eliminar
                  </button>
                </div>

                {[
                  ['nw', 'superior izquierda'],
                  ['ne', 'superior derecha'],
                  ['sw', 'inferior izquierda'],
                  ['se', 'inferior derecha'],
                ].map(([corner, label]) => (
                  <button
                    key={corner}
                    type='button'
                    className={`spreadsheet-image-overlay__resize-handle spreadsheet-image-overlay__resize-handle--${corner}`}
                    aria-label={`Redimensionar desde la esquina ${label}`}
                    title='Arrastra para cambiar el tamaño'
                    onPointerDown={event =>
                      handleResizeStart(event, currentImage, corner)
                    }
                    onPointerMove={handleResizeMove}
                    onPointerUp={handleResizeFinish}
                    onPointerCancel={handleResizeFinish}
                  />
                ))}
              </>
            )}
          </div>
        );
      })}
    </>,
    gridElement,
  );
}

export default SpreadsheetImageOverlay;
