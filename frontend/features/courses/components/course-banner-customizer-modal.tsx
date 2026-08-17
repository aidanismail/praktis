"use client";

import { useState } from "react";
import {
  X,
  Palette,
  UploadCloud,
  Check,
  Trash2,
  AlertCircle,
} from "lucide-react";
import type { Course } from "../types/course.type";
import {
  BANNER_THEMES,
  BANNER_PATTERNS,
  getThemeConfig,
  getPatternConfig,
  getDeterministicThemeId,
  loadSavedCourseTheme,
  saveCourseTheme,
  readFileAsDataUrl,
  type SavedCourseTheme,
} from "../constants/banner-themes";

type CourseBannerCustomizerModalProps = {
  isOpen: boolean;
  course: Course;
  onClose: () => void;
  onSaved?: (saved: SavedCourseTheme) => void;
};

export function CourseBannerCustomizerModal({
  isOpen,
  course,
  onClose,
  onSaved,
}: CourseBannerCustomizerModalProps) {
  const initial = loadSavedCourseTheme(course.id, course.code);

  const [activeTab, setActiveTab] = useState<"presets" | "upload">("presets");
  const [selectedThemeId, setSelectedThemeId] = useState<string>(initial.themeId);
  const [selectedPatternId, setSelectedPatternId] = useState<string>(initial.patternId);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(initial.imageUrl || null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsProcessingImage(true);
    setUploadError(null);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCustomImageUrl(dataUrl);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to load image.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleApply = () => {
    saveCourseTheme(course.id, selectedThemeId, selectedPatternId, customImageUrl);
    onSaved?.({
      themeId: selectedThemeId,
      patternId: selectedPatternId,
      imageUrl: customImageUrl,
    });
    onClose();
  };

  const handleResetDefault = () => {
    const defaultTheme = getDeterministicThemeId(course.code);
    setSelectedThemeId(defaultTheme);
    setSelectedPatternId("none");
    setCustomImageUrl(null);
    setUploadError(null);
  };

  const themeCfg = getThemeConfig(selectedThemeId);
  const patternCfg = getPatternConfig(selectedPatternId);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 transition-opacity animate-in fade-in duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]">
      <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 animate-apple-modal">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-slate-800" />
              <span>Customize Course Banner</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Customize colors, pattern, or upload an image for {course.code}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs apple-press transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Banner Preview with Embedded Trash Action */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Live Preview
            </span>
          </div>

          <div
            className={`rounded-2xl p-5 text-white shadow-xs relative overflow-hidden min-h-[110px] flex flex-col justify-between transition-all duration-300 ${
              !customImageUrl ? themeCfg.gradientClass : "bg-slate-900"
            }`}
          >
            {/* Custom Image Background */}
            {customImageUrl && (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                  style={{ backgroundImage: `url(${customImageUrl})` }}
                />
                {/* Vignette Overlay for Contrast & Legibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/70" />
              </>
            )}

            {/* Optional Pattern Overlay */}
            {patternCfg.id !== "none" && (
              <div className={`absolute inset-0 pointer-events-none ${patternCfg.overlayClass}`} />
            )}

            <div className="relative z-10 flex items-start justify-between gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${themeCfg.badgeBg} px-2.5 py-0.5 rounded-full backdrop-blur-xs`}>
                {course.code}
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10 backdrop-blur-xs">
                  {course.semester} {course.academic_year}
                </span>

                {/* In-Preview Remove Image Icon Button */}
                {customImageUrl && (
                  <button
                    type="button"
                    onClick={() => setCustomImageUrl(null)}
                    className="p-1 rounded-lg bg-black/40 hover:bg-rose-600/90 text-white/80 hover:text-white backdrop-blur-xs transition-colors shadow-xs border border-white/10"
                    title="Remove custom banner image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="relative z-10 mt-3">
              <h3 className="font-bold text-base text-white tracking-tight truncate drop-shadow-xs">
                {course.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "presets"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Presets & Patterns</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "upload"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Image {customImageUrl && "•"}</span>
          </button>
        </div>

        {/* Tab 1: Color Themes & Pattern Overlays */}
        {activeTab === "presets" && (
          <div className="space-y-4 animate-in fade-in duration-100">
            {/* Color Swatches */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Color Palettes
              </span>
              <div className="grid grid-cols-4 gap-2">
                {BANNER_THEMES.map((theme) => {
                  const isSelected = selectedThemeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        isSelected
                          ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: theme.previewColor }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-700 block truncate max-w-full">
                        {theme.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pattern Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Decorative Overlay Pattern
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {BANNER_PATTERNS.map((pattern) => {
                  const isSelected = selectedPatternId === pattern.id;
                  return (
                    <button
                      key={pattern.id}
                      type="button"
                      onClick={() => setSelectedPatternId(pattern.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {pattern.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Custom Banner Image Upload */}
        {activeTab === "upload" && (
          <div className="space-y-3 animate-in fade-in duration-100">
            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-6 text-center bg-slate-50/50 transition-colors">
              <label className="cursor-pointer flex flex-col items-center justify-center gap-2 py-2">
                <UploadCloud className="w-8 h-8 text-slate-400" />
                <span className="text-xs font-semibold text-slate-800">
                  {isProcessingImage
                    ? "Processing image..."
                    : customImageUrl
                      ? "Click or drag to replace banner image"
                      : "Click to browse or drag custom banner"}
                </span>
                <span className="text-[10px] text-slate-400">
                  Supported: JPG, PNG, WebP (Max 5MB • Panoramic/16:9 recommended)
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={isProcessingImage}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleResetDefault}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Reset to Default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold shadow-xs transition-colors"
            >
              Apply Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
