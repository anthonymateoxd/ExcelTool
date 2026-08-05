const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export function validateImageFile(file) {
  if (!file) {
    throw new Error('No se seleccionó ninguna imagen.');
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error(
      'Formato no permitido. Selecciona una imagen PNG, JPG, JPEG o WEBP.',
    );
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('La imagen no puede superar los 10 MB.');
  }
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);

    reader.onerror = () => {
      reject(new Error('No fue posible leer la imagen seleccionada.'));
    };

    reader.readAsDataURL(file);
  });
}

export function getImageDimensions(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = () => {
      reject(new Error('No fue posible obtener las dimensiones de la imagen.'));
    };

    image.src = dataUrl;
  });
}

function generateImageId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function prepareImageFile(file) {
  validateImageFile(file);

  const dataUrl = await fileToDataUrl(file);
  const dimensions = await getImageDimensions(dataUrl);

  return {
    id: generateImageId(),
    name: file.name || 'imagen-pegada.png',
    type: file.type,
    size: file.size,
    dataUrl,
    width: dimensions.width,
    height: dimensions.height,
  };
}
