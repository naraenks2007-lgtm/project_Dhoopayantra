function escapePdf(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

export function downloadTextPdf(filename, title, lines) {
  const contentLines = [
    `(${escapePdf(title)}) Tj`,
    '0 -28 Td',
    '/F0 11 Tf',
    ...lines.flatMap((line, index) => {
      const cmd = `(${escapePdf(line || ' ')}) Tj`;
      return index === 0 ? [cmd] : ['0 -18 Td', cmd];
    })
  ].join('\n');

  const stream = `BT
/F1 18 Tf
50 780 Td
${contentLines}
ET`;

  const rebuilt = [
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Page /Parent 5 0 R /MediaBox [0 0 612 792] /Contents 3 0 R /Resources << /Font << /F1 1 0 R /F0 2 0 R >> >> >>',
    '<< /Type /Pages /Kids [4 0 R] /Count 1 >>',
    '<< /Type /Catalog /Pages 5 0 R >>'
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  rebuilt.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${rebuilt.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${rebuilt.length + 1} /Root 6 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
