export function parseCSV(text: string) {
  const rows: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"' && text[i + 1] === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === '\n' && !insideQuotes) {
      rows.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  if (current) rows.push(current);

  const headers = rows[0].split(',').map(h => h.trim());

  const data = rows.slice(1).map(row => {
    const values: string[] = [];
    let val = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"' && row[i + 1] === '"') {
        val += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(val.trim());
        val = '';
      } else {
        val += char;
      }
    }

    values.push(val.trim());

    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });

    return obj;
  });

  return { headers, data };
}