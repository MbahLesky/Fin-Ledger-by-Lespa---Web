import Papa from "papaparse";
import { accountsRepository } from "@/db/repositories/accounts-repository";
import { auditRepository } from "@/db/repositories/audit-repository";
import { categoriesRepository } from "@/db/repositories/categories-repository";
import { settingsRepository } from "@/db/repositories/settings-repository";
import { transactionsRepository } from "@/db/repositories/transactions-repository";
import type {
  ImportMappingChoice,
  ImportRecord,
  InvalidImportRow,
  ParsedImportRow,
  TransactionType
} from "@/types";
import { createId } from "@/utils/id";
import { nowIso } from "@/utils/date-utils";

const REQUIRED_HEADERS = ["date", "type", "amount", "account"] as const;
function normalizeHeader(value: string) {
  return value.trim().toLowerCase();
}

function createInvalidRow(
  rowNumber: number,
  reason: string,
  raw: Record<string, string>
): InvalidImportRow {
  return {
    rowNumber,
    reason,
    raw
  };
}

function isValidIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export interface ImportPreview {
  headers: string[];
  validRows: ParsedImportRow[];
  invalidRows: InvalidImportRow[];
  accountMappings: ImportMappingChoice[];
  categoryMappings: ImportMappingChoice[];
}

export const csvImportService = {
  async parseFile(file: File): Promise<ImportPreview> {
    const [accounts, categories] = await Promise.all([
      accountsRepository.listActive(),
      categoriesRepository.listActive()
    ]);
    const text = await file.text();
    const headerLine = text.split(/\r?\n/, 1)[0] ?? "";
    const rawHeaders = headerLine.split(",").map(normalizeHeader).filter(Boolean);

    if (rawHeaders.length === 0) {
      throw new Error("The CSV file is empty.");
    }

    const duplicateHeaders = rawHeaders.filter(
      (header, index) => rawHeaders.indexOf(header) !== index
    );
    if (duplicateHeaders.length > 0) {
      throw new Error("Duplicate column headers were found. Remove duplicates and try again.");
    }

    const missingHeaders = REQUIRED_HEADERS.filter((header) => !rawHeaders.includes(header));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(", ")}.`);
    }

    const parseResult = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: false,
      transformHeader: normalizeHeader
    });

    const headers = parseResult.meta.fields ?? [];
    const validRows: ParsedImportRow[] = [];
    const invalidRows: InvalidImportRow[] = [];
    const seenRows = new Set<string>();

    parseResult.data.forEach((row, index) => {
      const rowNumber = index + 2;
      const normalizedRow = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, value?.trim() ?? ""])
      );

      const isEmpty = Object.values(normalizedRow).every((value) => value.length === 0);
      if (isEmpty) {
        return;
      }

      const date = normalizedRow.date ?? "";
      const type = normalizedRow.type?.toLowerCase() ?? "";
      const amount = Number(normalizedRow.amount ?? "");
      const account = normalizedRow.account ?? "";
      const category = normalizedRow.category ?? "";
      const note = normalizedRow.note ?? "";

      if (!isValidIsoDate(date)) {
        invalidRows.push(createInvalidRow(rowNumber, "Date must use YYYY-MM-DD format.", normalizedRow));
        return;
      }

      if (type !== "income" && type !== "expense") {
        invalidRows.push(
          createInvalidRow(rowNumber, "Type must be income or expense.", normalizedRow)
        );
        return;
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        invalidRows.push(
          createInvalidRow(rowNumber, "Amount must be a numeric value greater than zero.", normalizedRow)
        );
        return;
      }

      if (account.length === 0) {
        invalidRows.push(createInvalidRow(rowNumber, "Account is required.", normalizedRow));
        return;
      }

      const duplicateKey = [date, type, amount.toFixed(2), account.toLowerCase(), note.toLowerCase()].join("|");
      if (seenRows.has(duplicateKey)) {
        invalidRows.push(
          createInvalidRow(rowNumber, "This row is a duplicate of an earlier row in the same file.", normalizedRow)
        );
        return;
      }

      seenRows.add(duplicateKey);

      validRows.push({
        date,
        type: type as TransactionType,
        amount,
        account,
        category,
        note,
        rowNumber
      });
    });

    const accountMappings = Array.from(new Set(validRows.map((row) => row.account.trim()))).map((sourceName) => {
      const existing = accounts.find(
        (account) => account.name.trim().toLowerCase() === sourceName.trim().toLowerCase()
      );

      return {
        sourceName,
        targetId: existing?.id,
        createNew: !existing
      } satisfies ImportMappingChoice;
    });

    const categoryMappings = Array.from(
      new Map(
        validRows.map((row) => [
          `${row.type}:${row.category.trim().toLowerCase()}`,
          {
            sourceName: row.category.trim(),
            targetType: row.type
          }
        ])
      ).values()
    ).map((mapping) => {
      const existing = categories.find(
        (category) =>
          category.type === mapping.targetType &&
          category.name.trim().toLowerCase() === mapping.sourceName.trim().toLowerCase()
      );

      if (!mapping.sourceName) {
        const fallback = categories.find((category) => category.type === mapping.targetType);
        return {
          sourceName: mapping.sourceName,
          targetId: fallback?.id,
          createNew: false,
          targetType: mapping.targetType
        } satisfies ImportMappingChoice;
      }

      return {
        sourceName: mapping.sourceName,
        targetId: existing?.id,
        createNew: !existing,
        targetType: mapping.targetType
      } satisfies ImportMappingChoice;
    });

    return {
      headers,
      validRows,
      invalidRows,
      accountMappings,
      categoryMappings
    };
  },

  async commitImport(input: {
    fileName: string;
    preview: ImportPreview;
    accountMappings: ImportMappingChoice[];
    categoryMappings: ImportMappingChoice[];
    userId?: string | null;
  }) {
    const settings = await settingsRepository.getSettings();
    const createdAccounts = new Map<string, string>();
    const createdCategories = new Map<string, string>();
    let successfulRows = 0;
    let skippedRows = 0;

    for (const mapping of input.accountMappings) {
      if (!mapping.createNew || mapping.targetId) {
        continue;
      }

      const account = await accountsRepository.createAccount({
        name: mapping.sourceName,
        type: "other",
        initialBalance: 0,
        currencyCode: settings.currencyCode,
        userId: input.userId ?? null
      });

      createdAccounts.set(mapping.sourceName.toLowerCase(), account.id);
    }

    for (const mapping of input.categoryMappings) {
      if (mapping.sourceName.length === 0 && !mapping.targetId) {
        throw new Error("Blank categories must be mapped to an existing category before import.");
      }

      if (!mapping.createNew || mapping.targetId || !mapping.targetType) {
        continue;
      }

      const category = await categoriesRepository.createCategory({
        name: mapping.sourceName,
        type: mapping.targetType,
        userId: input.userId ?? null
      });

      createdCategories.set(`${mapping.targetType}:${mapping.sourceName.toLowerCase()}`, category.id);
    }

    for (const row of input.preview.validRows) {
      const accountMapping = input.accountMappings.find(
        (mapping) => mapping.sourceName.toLowerCase() === row.account.trim().toLowerCase()
      );
      const categoryMapping = input.categoryMappings.find(
        (mapping) =>
          mapping.targetType === row.type &&
          mapping.sourceName.trim().toLowerCase() === row.category.trim().toLowerCase()
      );

      const accountId =
        accountMapping?.targetId ?? createdAccounts.get(row.account.trim().toLowerCase());
      const categoryId =
        categoryMapping?.targetId ??
        createdCategories.get(`${row.type}:${row.category.trim().toLowerCase()}`);

      if (!accountId || !categoryId) {
        skippedRows += 1;
        continue;
      }

      const duplicate = await transactionsRepository.findLikelyDuplicate({
        transactionDate: row.date,
        type: row.type,
        amount: row.amount,
        accountId,
        note: row.note
      });

      if (duplicate) {
        skippedRows += 1;
        continue;
      }

      await transactionsRepository.createTransaction({
        amount: row.amount,
        type: row.type,
        accountId,
        categoryId,
        note: row.note,
        transactionDate: row.date,
        reference: `Imported from ${input.fileName}`,
        userId: input.userId ?? null
      });

      successfulRows += 1;
    }

    const failedRows = input.preview.invalidRows.length + skippedRows;
    const record: ImportRecord = {
      id: createId("import"),
      fileName: input.fileName,
      format: "csv",
      totalRecords: input.preview.validRows.length + input.preview.invalidRows.length,
      successfulRecords: successfulRows,
      failedRecords: failedRows,
      status:
        successfulRows === 0 ? "failed" : failedRows > 0 ? "partial" : "success",
      errorSummary:
        failedRows > 0
          ? `${failedRows} row${failedRows === 1 ? "" : "s"} were skipped or invalid.`
          : "",
      createdAt: nowIso()
    };

    await auditRepository.addImportRecord(record);
    return record;
  }
};
