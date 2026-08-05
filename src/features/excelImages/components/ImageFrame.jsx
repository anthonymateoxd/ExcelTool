import { useRef } from 'react';
import { IMAGE_SIZE_LIMITS } from '../hooks/useImageEditor';

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function ImageFrame({
  image,
  width,
  height,
  fit,
  aspectRatio,
  lockAspectRatio,
  onResize,
}) {
  const resizeStateRef = useRef(null);

  const handleResizeStart = event => {
    event.preventDefault();
    event.stopPropagation();

    event.currentTarget.setPointerCapture(event.pointerId);

    resizeStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: width,
      startHeight: height,
    };
  };

  const handleResizeMove = event => {
    const resizeState = resizeStateRef.current;

    if (!resizeState || resizeState.pointerId !== event.pointerId) {
      return;
    }

    const { minWidth, minHeight, maxWidth, maxHeight } = IMAGE_SIZE_LIMITS;

    const movementX = event.clientX - resizeState.startX;

    const movementY = event.clientY - resizeState.startY;

    let newWidth = clamp(
      resizeState.startWidth + movementX,
      minWidth,
      maxWidth,
    );

    let newHeight = clamp(
      resizeState.startHeight + movementY,
      minHeight,
      maxHeight,
    );

    if (lockAspectRatio) {
      newHeight = newWidth / aspectRatio;

      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * aspectRatio;
      }

      if (newHeight < minHeight) {
        newHeight = minHeight;
        newWidth = newHeight * aspectRatio;
      }

      newWidth = clamp(newWidth, minWidth, maxWidth);
      newHeight = clamp(newHeight, minHeight, maxHeight);
    }

    onResize(newWidth, newHeight);
  };

  const finishResize = event => {
    const resizeState = resizeStateRef.current;

    if (!resizeState || resizeState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    resizeStateRef.current = null;
  };

  return (
    <div
      className='image-editor-frame'
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <img
        src={image.dataUrl}
        alt={image.name}
        draggable='false'
        style={{
          objectFit: fit,
        }}
      />

      <span className='image-editor-frame__size'>
        {width} × {height} px
      </span>

      <button
        type='button'
        className='image-editor-frame__resize-handle'
        aria-label='Cambiar tamaño de la imagen'
        title='Arrastra para cambiar el tamaño'
        onPointerDown={handleResizeStart}
        onPointerMove={handleResizeMove}
        onPointerUp={finishResize}
        onPointerCancel={finishResize}
      />
    </div>
  );
}

export default ImageFrame;
