import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getColorWithOpacity = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    red: "255, 0, 0",
    blue: "0, 0, 255",
    green: "0, 128, 0",
    yellow: "255, 255, 0",
    purple: "128, 0, 128",
    orange: "255, 165, 0",
    pink: "255, 192, 203",
    teal: "0, 128, 128",
    cyan: "0, 255, 255",
    indigo: "75, 0, 130",
    lime: "0, 255, 0",
    amber: "255, 191, 0",
    emerald: "80, 200, 120",
    sky: "135, 206, 235",
    violet: "238, 130, 238",
    fuchsia: "255, 0, 255",
    rose: "255, 0, 127"
  };

  const rgbValue = colorMap[colorName.toLowerCase()] || "0, 0, 0";

  return `rgba(${rgbValue}, 0.15)`;
};
