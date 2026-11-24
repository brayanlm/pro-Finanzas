import { movementRepository } from '../repositories/index.js';
import { AppError } from '../utils/AppError.js';

export const exportReport = async (req, res, next) => {
  try {
    const { format, year, month, type, categoryId, accountId, startDate, endDate } = req.query;

    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const filters = {};
    if (type && type !== 'all') filters.type = type;
    if (categoryId) filters.categoryId = categoryId;
    if (accountId) filters.accountId = accountId;
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    } else {
      filters.date = {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lte: new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)
      };
    }

    const movements = await movementRepository.findForExport(req.user.id, filters);

    if (format === 'pdf') {
      return generatePDF(res, movements, { year: currentYear, month: currentMonth, filters });
    } else if (format === 'excel') {
      return generateExcel(res, movements, { year: currentYear, month: currentMonth, filters });
    }

    throw AppError.badRequest('Formato no soportado');
  } catch (error) {
    next(error);
  }
};

const generatePDF = async (res, movements, options) => {
  const { PDFDocument } = await import('pdfkit');
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="reporte-${options.year}-${String(options.month).padStart(2, '0')}.pdf"`);

  doc.pipe(res);

  doc.fontSize(24).text('Reporte Financiero', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Período: ${options.month}/${options.year}`, { align: 'center' });
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
  doc.moveDown(2);

  const income = movements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0);
  const expense = movements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0);
  const balance = income - expense;

  doc.fontSize(14).text('Resumen', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11);
  doc.text(`Ingresos totales: ${income.toFixed(2)} EUR`);
  doc.text(`Gastos totales: ${expense.toFixed(2)} EUR`);
  doc.text(`Balance: ${balance.toFixed(2)} EUR`);
  doc.moveDown();

  if (movements.length > 0) {
    doc.fontSize(14).text('Movimientos', { underline: true });
    doc.moveDown(0.5);

    const tableHeaders = ['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Cuenta', 'Importe'];
    const colWidths = [70, 50, 150, 80, 80, 60];
    let y = doc.y;

    doc.fontSize(9).font('Helvetica-Bold');
    tableHeaders.forEach((header, i) => {
      doc.text(header, 40 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colWidths[i], align: i === 5 ? 'right' : 'left' });
    });
    doc.moveDown(0.5);
    doc.font('Helvetica');

    movements.slice(0, 50).forEach((m, _idx) => {
      if (doc.y > 700) {
        doc.addPage();
        y = doc.y;
      }
      const row = [
        new Date(m.date).toLocaleDateString('es-ES'),
        m.type === 'income' ? 'Ingreso' : 'Gasto',
        m.description,
        m.category?.name || '-',
        m.account?.name || '-',
        `${m.amount.toFixed(2)} EUR`
      ];
      row.forEach((cell, i) => {
        doc.text(cell, 40 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), doc.y, { width: colWidths[i], align: i === 5 ? 'right' : 'left' });
      });
      doc.moveDown(0.3);
    });
  }

  doc.end();
};

const generateExcel = async (res, movements, options) => {
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();

  const income = movements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0);
  const expense = movements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0);
  const balance = income - expense;

  const summaryData = [
    ['Reporte Financiero'],
    [`Período: ${options.month}/${options.year}`],
    [`Generado: ${new Date().toLocaleDateString('es-ES')}`],
    [],
    ['Resumen'],
    ['Ingresos totales', income.toFixed(2), 'EUR'],
    ['Gastos totales', expense.toFixed(2), 'EUR'],
    ['Balance', balance.toFixed(2), 'EUR'],
    []
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');

  const movementsData = [
    ['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Cuenta', 'Importe', 'Notas']
  ];
  movements.forEach(m => {
    movementsData.push([
      new Date(m.date).toLocaleDateString('es-ES'),
      m.type === 'income' ? 'Ingreso' : 'Gasto',
      m.description,
      m.category?.name || '-',
      m.account?.name || '-',
      m.amount,
      m.notes || ''
    ]);
  });
  const movementsWs = XLSX.utils.aoa_to_sheet(movementsData);
  XLSX.utils.book_append_sheet(wb, movementsWs, 'Movimientos');

  const categoryMap = {};
  movements.filter(m => m.type === 'expense').forEach(m => {
    const catName = m.category?.name || 'Sin categoría';
    if (!categoryMap[catName]) categoryMap[catName] = 0;
    categoryMap[catName] += m.amount;
  });
  const categoryData = [['Categoría', 'Total', 'Porcentaje']];
  Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).forEach(([cat, total]) => {
    categoryData.push([cat, total.toFixed(2), `${((total / expense) * 100).toFixed(1)}%`]);
  });
  const categoryWs = XLSX.utils.aoa_to_sheet(categoryData);
  XLSX.utils.book_append_sheet(wb, categoryWs, 'Por Categoría');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="reporte-${options.year}-${String(options.month).padStart(2, '0')}.xlsx"`);
  res.send(buffer);
};

export const getReportPreview = async (req, res, next) => {
  try {
    const { year, month, type, categoryId, accountId, startDate, endDate } = req.query;

    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const filters = {};
    if (type && type !== 'all') filters.type = type;
    if (categoryId) filters.categoryId = categoryId;
    if (accountId) filters.accountId = accountId;
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    } else {
      filters.date = {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lte: new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)
      };
    }

    const movements = await movementRepository.findForExport(req.user.id, filters);

    const income = movements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0);
    const expense = movements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0);

    res.json({
      success: true,
      data: {
        movements,
        summary: {
          income: income.toFixed(2),
          expense: expense.toFixed(2),
          balance: (income - expense).toFixed(2),
          count: movements.length
        },
        filters: { year: currentYear, month: currentMonth, ...filters }
      }
    });
  } catch (error) {
    next(error);
  }
};