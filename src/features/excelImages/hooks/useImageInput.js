import { useCallback, useEffect, useState } from 'react';
import { prepareImageFile } from '../utils/imageUtils';

function isEditableElement(element) {
  if (!element) {
    return false;
  }

  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement ||
    element.isContentEditable
  );
}

function getClipboardImage(event) {
  const clipboardItems = Array.from(event.clipboardData?.items ?? []);

  const imageItem = clipboardItems.find(
    item => item.kind === 'file' && item.type.startsWith('image/'),
  );

  return imageItem?.getAsFile() ?? null;
}

export function useImageInput({ enablePaste = true } = {}) {
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectImage = useCallback(async (file, source = 'upload') => {
    if (!file) {
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const preparedImage = await prepareImageFile(file);

      setImage({
        ...preparedImage,
        source,
      });
    } catch (imageError) {
      setImage(null);

      setError(
        imageError instanceof Error
          ? imageError.message
          : 'Ocurrió un error al procesar la imagen.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = useCallback(
    async event => {
      const file = event.target.files?.[0];

      await selectImage(file, 'upload');

      // Permite volver a escoger el mismo archivo.
      event.target.value = '';
    },
    [selectImage],
  );

  const clearImage = useCallback(() => {
    setImage(null);
    setError('');
  }, []);

  useEffect(() => {
    if (!enablePaste) {
      return undefined;
    }

    const handlePaste = event => {
      /*
       * Evita interceptar Ctrl + V cuando el usuario
       * está escribiendo contenido dentro de una celda
       * o de un formulario.
       */
      if (isEditableElement(document.activeElement)) {
        return;
      }

      const clipboardImage = getClipboardImage(event);

      if (!clipboardImage) {
        return;
      }

      event.preventDefault();

      void selectImage(clipboardImage, 'clipboard');
    };

    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [enablePaste, selectImage]);

  return {
    image,
    error,
    isLoading,
    selectImage,
    handleInputChange,
    clearImage,
  };
}
