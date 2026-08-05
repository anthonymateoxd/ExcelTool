import { useCallback, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './SpreadsheetImageOverlay.css';

function SpreadsheetImageOverlay({ images = [], selectedSheet, gridRef }) {
  const [positions, setPositions] = useState({});

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

    const handleResize = () => {
      calculatePositions();
    };

    const handleScroll = () => {
      calculatePositions();
    };

    window.addEventListener('resize', handleResize);
    gridElement.addEventListener('scroll', handleScroll);

    const resizeObserver = new ResizeObserver(() => {
      calculatePositions();
    });

    resizeObserver.observe(gridElement);

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener('resize', handleResize);

      gridElement.removeEventListener('scroll', handleScroll);

      resizeObserver.disconnect();
    };
  }, [calculatePositions, gridRef]);

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

        return (
          <div
            key={image.id}
            className='spreadsheet-image-overlay'
            data-image-id={image.id}
            style={{
              left: `${position.left}px`,
              top: `${position.top}px`,
              width: `${image.width}px`,
              height: `${image.height}px`,
            }}
          >
            <img
              src={image.dataUrl}
              alt={image.name}
              draggable='false'
              style={{
                objectFit: image.fit || 'contain',
              }}
            />
          </div>
        );
      })}
    </>,
    gridElement,
  );
}

export default SpreadsheetImageOverlay;
