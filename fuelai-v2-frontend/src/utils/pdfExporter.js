import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportToPdf = async (element, fileName) => {
  if (!element) {
    console.error("Element to export not found!");
    return;
  }

  const canvas = await html2canvas(element, {
    scale: 2, 
    useCORS: true,
  });

  const imgData = canvas.toDataURL('image/png');
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const ratio = canvasWidth / canvasHeight;

  let imgWidth = pdfWidth - 20; // with margin
  let imgHeight = imgWidth / ratio;

  if (imgHeight > pdfHeight - 20) {
    imgHeight = pdfHeight - 20;
    imgWidth = imgHeight * ratio;
  }

  const x = (pdfWidth - imgWidth) / 2;
  const y = 10; // top margin

  pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
  pdf.save(`${fileName}.pdf`);
};