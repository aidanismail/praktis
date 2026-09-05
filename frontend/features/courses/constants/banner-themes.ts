export type BannerTheme = {
  id: string;
  label: string;
  gradientClass: string;
  badgeBg: string;
  previewColor: string;
};

export type BannerPattern = {
  id: string;
  label: string;
  overlayClass: string;
};

export type SavedCourseTheme = {
  themeId: string;
  patternId: string;
  imageUrl?: string | null;
};

export const BANNER_THEMES: BannerTheme[] = [
  {
    id: "midnight",
    label: "Midnight Slate",
    gradientClass: "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900",
    badgeBg: "bg-white/15 text-white",
    previewColor: "#0f172a",
  },
  {
    id: "ocean",
    label: "Deep Ocean Blue",
    gradientClass: "bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900",
    badgeBg: "bg-blue-400/20 text-blue-100",
    previewColor: "#172554",
  },
  {
    id: "emerald",
    label: "Emerald Forest",
    gradientClass: "bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900",
    badgeBg: "bg-emerald-400/20 text-emerald-100",
    previewColor: "#064e3b",
  },
  {
    id: "crimson",
    label: "Crimson Burgundy",
    gradientClass: "bg-gradient-to-r from-rose-950 via-red-900 to-slate-900",
    badgeBg: "bg-rose-400/20 text-rose-100",
    previewColor: "#881337",
  },
  {
    id: "amethyst",
    label: "Amethyst Purple",
    gradientClass: "bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900",
    badgeBg: "bg-purple-400/20 text-purple-100",
    previewColor: "#581c87",
  },
  {
    id: "amber",
    label: "Sunset Amber",
    gradientClass: "bg-gradient-to-r from-amber-950 via-orange-900 to-stone-900",
    badgeBg: "bg-amber-400/20 text-amber-100",
    previewColor: "#78350f",
  },
  {
    id: "teal",
    label: "Cyan Teal",
    gradientClass: "bg-gradient-to-r from-cyan-950 via-teal-900 to-slate-900",
    badgeBg: "bg-cyan-400/20 text-cyan-100",
    previewColor: "#164e63",
  },
  {
    id: "onyx",
    label: "Obsidian Onyx",
    gradientClass: "bg-gradient-to-r from-zinc-950 via-neutral-900 to-black",
    badgeBg: "bg-white/20 text-white",
    previewColor: "#09090b",
  },
];

export const BANNER_PATTERNS: BannerPattern[] = [
  {
    id: "none",
    label: "Clean Minimal",
    overlayClass: "",
  },
  {
    id: "mesh",
    label: "Geometric Grid",
    overlayClass: "bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px]",
  },
  {
    id: "dots",
    label: "Subtle Dots",
    overlayClass: "bg-[radial-gradient(#ffffff20_1px,transparent_1px)] [background-size:24px_24px]",
  },
  {
    id: "diagonal",
    label: "Diagonal Accent",
    overlayClass: "bg-[linear-gradient(45deg,#ffffff08_25%,transparent_25%,transparent_50%,#ffffff08_50%,#ffffff08_75%,transparent_75%,transparent)] [background-size:20px_20px]",
  },
];

export function getDeterministicThemeId(code: string): string {
  if (!code) return BANNER_THEMES[0].id;
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % BANNER_THEMES.length;
  return BANNER_THEMES[index].id;
}

export function getThemeConfig(themeId?: string | null): BannerTheme {
  const found = BANNER_THEMES.find((t) => t.id === themeId);
  return found || BANNER_THEMES[0];
}

export function getPatternConfig(patternId?: string | null): BannerPattern {
  const found = BANNER_PATTERNS.find((p) => p.id === patternId);
  return found || BANNER_PATTERNS[0];
}

const STORAGE_KEY_PREFIX = "praktis_course_theme_";

export function getCourseBannerTheme(course?: {
  id?: string;
  code?: string;
  banner_theme_id?: string | null;
  banner_pattern_id?: string | null;
  banner_image_url?: string | null;
} | null): SavedCourseTheme {
  if (!course) {
    return {
      themeId: BANNER_THEMES[0].id,
      patternId: "none",
      imageUrl: null,
    };
  }

  if (course.banner_theme_id || course.banner_pattern_id || course.banner_image_url) {
    return {
      themeId: course.banner_theme_id || (course.code ? getDeterministicThemeId(course.code) : BANNER_THEMES[0].id),
      patternId: course.banner_pattern_id || "none",
      imageUrl: course.banner_image_url || null,
    };
  }

  if (course.id) {
    return loadSavedCourseTheme(course.id, course.code);
  }

  return {
    themeId: course.code ? getDeterministicThemeId(course.code) : BANNER_THEMES[0].id,
    patternId: "none",
    imageUrl: null,
  };
}

export function loadSavedCourseTheme(
  courseId: string,
  courseCode?: string,
  courseData?: {
    banner_theme_id?: string | null;
    banner_pattern_id?: string | null;
    banner_image_url?: string | null;
  }
): SavedCourseTheme {
  if (courseData && (courseData.banner_theme_id || courseData.banner_pattern_id || courseData.banner_image_url)) {
    return {
      themeId: courseData.banner_theme_id || (courseCode ? getDeterministicThemeId(courseCode) : BANNER_THEMES[0].id),
      patternId: courseData.banner_pattern_id || "none",
      imageUrl: courseData.banner_image_url || null,
    };
  }

  if (typeof window === "undefined") {
    return {
      themeId: courseCode ? getDeterministicThemeId(courseCode) : BANNER_THEMES[0].id,
      patternId: "none",
      imageUrl: null,
    };
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${courseId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.themeId) {
        return {
          themeId: parsed.themeId,
          patternId: parsed.patternId || "none",
          imageUrl: parsed.imageUrl || null,
        };
      }
    }
  } catch {
    // ignore json errors
  }

  return {
    themeId: courseCode ? getDeterministicThemeId(courseCode) : BANNER_THEMES[0].id,
    patternId: "none",
    imageUrl: null,
  };
}

export function saveCourseTheme(courseId: string, themeId: string, patternId = "none", imageUrl: string | null = null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${courseId}`,
      JSON.stringify({ themeId, patternId, imageUrl })
    );
    // Dispatch storage update event for multi-tab or cross-component reactivity
    window.dispatchEvent(
      new CustomEvent("course-theme-updated", {
        detail: { courseId, themeId, patternId, imageUrl },
      })
    );
  } catch {
    // ignore storage exceptions
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selected file must be an image (.jpg, .png, .webp)."));
      return;
    }
    // Max 5MB check
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("Image size must be less than 5MB."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to process image data."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}
