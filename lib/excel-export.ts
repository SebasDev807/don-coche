import ExcelJS from 'exceljs';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  style?: Partial<ExcelJS.Style>;
}

export interface ExportToExcelOptions {
  sheetName?: string;
  columns: ExcelColumn[];
  data: any[];
}

/**
 * Genera un buffer de un archivo Excel (.xlsx) a partir de los datos proporcionados.
 * Aplica estilos por defecto a la fila de encabezados (negrita, fondo gris, autofiltro, inmovilización).
 *
 * @param options Opciones de configuración para la exportación.
 * @returns Promesa que resuelve en un Buffer conteniendo el archivo Excel.
 */
export async function generateExcelBuffer({
  sheetName = 'Hoja 1',
  columns,
  data,
}: ExportToExcelOptions): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 1 }], // Inmovilizar primera fila
  });

  worksheet.columns = columns;

  // Estilos de la cabecera
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F4F4F' }, // Gris oscuro
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Añadir datos
  worksheet.addRows(data);

  // Autofiltro para todas las columnas en la primera fila
  const lastColumnLetter = worksheet.getColumn(columns.length).letter;
  worksheet.autoFilter = `A1:${lastColumnLetter}1`;

  // Generar Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  return buffer as any;
}
