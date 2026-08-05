import { useCallback, useEffect, useMemo, useState } from 'react';

export const IMAGE_SIZE_LIMITS = Object.freeze({
  minWidth: 140,
  minHeight: 90,
  maxWidth: 680,
  maxHeight: 420,
});

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function calculateInitialSize(image) {
  if (!image?.width || !image?.height) {
    return {
      width: 360,
      height: 220,
    };
  }

  const { maxWidth, maxHeight } = IMAGE_SIZE_LIMITS;

  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);

  return {
    width: Math.max(140, Math.round(image.width * scale)),
    height: Math.max(90, Math.round(image.height * scale)),
  };
}

export function useImageEditor(image) {
  const initialSize = useMemo(() => calculateInitialSize(image), [image]);

  const aspectRatio = useMemo(() => {
    if (!image?.width || !image?.height) {
      return 1;
    }

    return image.width / image.height;
  }, [image]);

  const [size, setSize] = useState(initialSize);
  const [fit, setFit] = useState('contain');
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  useEffect(() => {
    setSize(initialSize);
    setFit('contain');
    setLockAspectRatio(true);
  }, [image?.id, initialSize]);

  const resize = useCallback((width, height) => {
    const { minWidth, minHeight, maxWidth, maxHeight } = IMAGE_SIZE_LIMITS;

    setSize({
      width: clamp(Math.round(width), minWidth, maxWidth),
      height: clamp(Math.round(height), minHeight, maxHeight),
    });
  }, []);

  const changeWidth = useCallback(
    newWidth => {
      const width = Number(newWidth);

      if (!Number.isFinite(width)) {
        return;
      }

      const { minWidth, maxWidth, minHeight, maxHeight } = IMAGE_SIZE_LIMITS;

      const normalizedWidth = clamp(width, minWidth, maxWidth);

      setSize(currentSize => ({
        width: normalizedWidth,
        height: lockAspectRatio
          ? clamp(
              Math.round(normalizedWidth / aspectRatio),
              minHeight,
              maxHeight,
            )
          : currentSize.height,
      }));
    },
    [aspectRatio, lockAspectRatio],
  );

  const changeHeight = useCallback(
    newHeight => {
      const height = Number(newHeight);

      if (!Number.isFinite(height)) {
        return;
      }

      const { minWidth, maxWidth, minHeight, maxHeight } = IMAGE_SIZE_LIMITS;

      const normalizedHeight = clamp(height, minHeight, maxHeight);

      setSize(currentSize => ({
        width: lockAspectRatio
          ? clamp(
              Math.round(normalizedHeight * aspectRatio),
              minWidth,
              maxWidth,
            )
          : currentSize.width,
        height: normalizedHeight,
      }));
    },
    [aspectRatio, lockAspectRatio],
  );

  const resetEditor = useCallback(() => {
    setSize(initialSize);
    setFit('contain');
    setLockAspectRatio(true);
  }, [initialSize]);

  return {
    width: size.width,
    height: size.height,
    fit,
    lockAspectRatio,
    aspectRatio,
    resize,
    changeWidth,
    changeHeight,
    setFit,
    setLockAspectRatio,
    resetEditor,
  };
}
