export function toCsvRow(fields: (string | number | null | undefined)[]) {
  return fields
    .map((v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      // encapsule si virgule, guillemet ou newline
      if (/[",\n]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    })
    .join(",");
}

export function toCsv(content: (string | number | null | undefined)[][]) {
  return content.map(toCsvRow).join("\n");
}
