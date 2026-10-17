import { readFileSync } from 'node:fs';
import { csvParseRows } from 'd3';

export interface CsvPreview {
  header: string[];
  rows: string[][];
  total: number;
}

export function previewCsv(abs: string, maxRows = 20): CsvPreview {
  const all = csvParseRows(readFileSync(abs, 'utf8'));
  const [header = [], ...body] = all;
  return { header, rows: body.slice(0, maxRows), total: body.length };
}
