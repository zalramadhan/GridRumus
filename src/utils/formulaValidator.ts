export interface ValidationResult {
  isCorrect: boolean;
  message: string;
}

/**
 * Normalizes an Excel formula string for fair comparison:
 * - Preserves string literals inside double quotes (lowercased for case-insensitive text criteria)
 * - Removes whitespace outside quotes
 * - Converts ';' argument separators outside quotes into ','
 * - Strips '$' absolute-reference signs outside quotes
 * - Uppercases Excel keywords/cell references outside quotes
 */
export function normalizeExcelFormula(raw: string): string {
  const trimmed = raw.trim();
  let result = '';
  let inQuotes = false;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      result += ch;
      continue;
    }

    if (inQuotes) {
      result += ch.toLowerCase();
    } else {
      if (/\s/.test(ch)) continue;
      if (ch === ';') {
        result += ',';
      } else if (ch === '$') {
        continue;
      } else {
        result += ch.toUpperCase();
      }
    }
  }

  return result;
}

function expandVariants(normalized: string): string[] {
  const variants = new Set<string>([normalized]);
  // Allow FALSE <-> 0 and TRUE <-> 1 at trailing lookup/exact arguments
  variants.add(normalized.replace(/,FALSE\)/g, ',0)').replace(/,TRUE\)/g, ',1)'));
  variants.add(normalized.replace(/,0\)/g, ',FALSE)').replace(/,1\)/g, ',TRUE)'));
  return Array.from(variants);
}

export function validatePracticeFormula(
  userInput: string,
  acceptedFormulas: string[]
): ValidationResult {
  const trimmed = userInput.trim();
  if (!trimmed) {
    return {
      isCorrect: false,
      message: 'Ketik rumus Excel terlebih dahulu di kotak jawaban (diawali tanda =).',
    };
  }

  if (!trimmed.startsWith('=')) {
    return {
      isCorrect: false,
      message: 'Setiap rumus Excel harus diawali dengan tanda sama dengan (=), misalnya =SUM(B2:B4).',
    };
  }

  const normalizedUser = normalizeExcelFormula(trimmed);
  const userVariants = expandVariants(normalizedUser);

  for (const accepted of acceptedFormulas) {
    const normalizedAccepted = normalizeExcelFormula(accepted);
    const acceptedVariants = expandVariants(normalizedAccepted);
    for (const uv of userVariants) {
      if (acceptedVariants.includes(uv)) {
        return {
          isCorrect: true,
          message: 'Tepat sekali! Rumus Anda valid dan menghasilkan nilai yang benar.',
        };
      }
    }
  }

  // Check if parentheses are balanced
  let depth = 0;
  let inQuotes = false;
  for (const ch of trimmed) {
    if (ch === '"') inQuotes = !inQuotes;
    if (!inQuotes) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
    }
  }
  if (depth !== 0) {
    return {
      isCorrect: false,
      message: 'Jumlah tanda kurung buka dan kurung tutup belum seimbang. Periksa kembali rumus Anda.',
    };
  }

  return {
    isCorrect: false,
    message: 'Rumus belum sesuai dengan target sel. Cek rentang sel, nama fungsi, atau petunjuk.',
  };
}
