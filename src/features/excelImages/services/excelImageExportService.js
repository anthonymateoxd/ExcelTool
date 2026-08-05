const DEFAULT_CELL_WIDTH_PX = 96;
const DEFAULT_CELL_HEIGHT_PX = 24;

function columnLabelToIndex(columnLabel) {
  return (
    columnLabel
      .toUpperCase()
      .split('')
      .reduce((result, character) => {
        return result * 26 + character.charCodeAt(0) - 64;
      }, 0) - 1
  );
}

function parseCellAddress(cellAddress) {
  const match = /^([A-Z]+)([1-9]\d*)$/i.exec(cellAddress || '');

  if (!match) {
    return {
      columnIndex: 0,
      rowIndex: 0,
    };
  }

  return {
    columnIndex: columnLabelToIndex(match[1]),
    rowIndex: Number(match[2]) - 1,
  };
}

function loadImageElement(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);

    image.onerror = () => {
      reject(
        new Error('No fue posible preparar una imagen para el archivo Excel.'),
      );
    };

    image.src = dataUrl;
  });
}

/*
 * Convierte cualquier imagen admitida por el navegador,
 * incluyendo WEBP, a PNG.
 *
 * También reproduce el comportamiento contain/cover
 * utilizado en la vista previa.
 */
async function renderImageAsPng(imageConfiguration) {
  const sourceImage = await loadImageElement(imageConfiguration.dataUrl);

  const configuredWidth = Number(imageConfiguration.width);

  const configuredHeight = Number(imageConfiguration.height);

  const targetWidth = Math.max(
    1,
    Math.round(
      Number.isFinite(configuredWidth)
        ? configuredWidth
        : sourceImage.naturalWidth,
    ),
  );

  const targetHeight = Math.max(
    1,
    Math.round(
      Number.isFinite(configuredHeight)
        ? configuredHeight
        : sourceImage.naturalHeight,
    ),
  );

  const canvas = document.createElement('canvas');

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('El navegador no pudo preparar la imagen para Excel.');
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const horizontalScale = targetWidth / sourceImage.naturalWidth;

  const verticalScale = targetHeight / sourceImage.naturalHeight;

  const scale =
    imageConfiguration.fit === 'cover'
      ? Math.max(horizontalScale, verticalScale)
      : Math.min(horizontalScale, verticalScale);

  const drawingWidth = sourceImage.naturalWidth * scale;

  const drawingHeight = sourceImage.naturalHeight * scale;

  const drawingX = (targetWidth - drawingWidth) / 2;

  const drawingY = (targetHeight - drawingHeight) / 2;

  context.drawImage(
    sourceImage,
    drawingX,
    drawingY,
    drawingWidth,
    drawingHeight,
  );

  return canvas.toDataURL('image/png');
}

function getImageAnchor(image) {
  const { columnIndex, rowIndex } = parseCellAddress(image.cellAddress);

  const cellWidth = Math.max(
    1,
    Number(image.anchorCellWidth) || DEFAULT_CELL_WIDTH_PX,
  );

  const cellHeight = Math.max(
    1,
    Number(image.anchorCellHeight) || DEFAULT_CELL_HEIGHT_PX,
  );

  const offsetX = Number(image.offsetX) || 0;
  const offsetY = Number(image.offsetY) || 0;

  return {
    col: Math.max(0, columnIndex + offsetX / cellWidth),

    row: Math.max(0, rowIndex + offsetY / cellHeight),
  };
}

export async function addImagesToWorkbook(workbook, images = []) {
  for (const image of images) {
    if (!image?.dataUrl || !image?.sheetName || !image?.cellAddress) {
      continue;
    }

    const worksheet = workbook.getWorksheet(image.sheetName);

    if (!worksheet) {
      continue;
    }

    const pngDataUrl = await renderImageAsPng(image);

    const imageId = workbook.addImage({
      base64: pngDataUrl,
      extension: 'png',
    });

    worksheet.addImage(imageId, {
      tl: getImageAnchor(image),

      ext: {
        width: Math.max(1, Math.round(Number(image.width) || 1)),

        height: Math.max(1, Math.round(Number(image.height) || 1)),
      },

      /*
       * Mantiene la imagen vinculada a su celda inicial,
       * conservando el tamaño establecido.
       */
      editAs: 'oneCell',
    });
  }
}
