"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { importStudentsCsv } from "../api/admin.api";
import type { ImportCsvResponse } from "../types/admin.type";

export function BulkImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportCsvResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Pick a .csv or .xlsx spreadsheet file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const res = await importStudentsCsv(file);
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't process import file. Please check the format and try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* Upload Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 mb-3">
              <UploadCloud className="h-6 w-6" />
            </div>

            <div className="flex text-xs font-semibold text-slate-700">
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-slate-900 underline hover:text-slate-700"
              >
                <span>Upload a spreadsheet</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".csv,.xlsx"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
              <span className="pl-1 text-slate-500 font-normal">or drag and drop</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">.csv or .xlsx up to 5 MB with columns: username, email</p>

            {file && (
              <div className="mt-3.5 rounded-full bg-slate-100 border border-slate-300 px-4 py-1 text-xs font-medium text-slate-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              New accounts will be initialized with default passwords.
            </span>

            <button
              type="submit"
              disabled={!file || isUploading}
              className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {isUploading ? "Importing..." : "Import Students"}
            </button>
          </div>
        </form>
      </div>

      {/* Results Summary Box */}
      {result && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900">Import Summary</h4>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-xs font-semibold text-slate-900">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{result.message}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
              <p className="text-[11px] font-medium text-slate-500">Total rows</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{result.total_rows}</p>
            </div>
            <div className="rounded-xl bg-slate-100 border border-slate-200 p-3 text-center">
              <p className="text-[11px] font-medium text-slate-700">Imported</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{result.inserted}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
              <p className="text-[11px] font-medium text-slate-500">Duplicate NPM</p>
              <p className="mt-1 text-xl font-bold text-slate-700">{result.skipped_duplicate_username}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
              <p className="text-[11px] font-medium text-slate-500">Duplicate Email</p>
              <p className="mt-1 text-xl font-bold text-slate-700">{result.skipped_duplicate_email}</p>
            </div>
          </div>

          {result.invalid_rows && result.invalid_rows.length > 0 && (
            <div className="mt-3">
              <h5 className="text-xs font-semibold text-rose-600 mb-2">Issues found:</h5>
              <ul className="divide-y divide-slate-100 rounded-xl border border-rose-200 bg-rose-50/50 text-xs">
                {result.invalid_rows.map((inv, idx) => (
                  <li key={idx} className="p-2.5 text-rose-700 flex justify-between">
                    <span>Row {inv.row}</span>
                    <span className="font-medium">{inv.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
