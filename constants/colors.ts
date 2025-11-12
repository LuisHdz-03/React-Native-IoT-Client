export const AppColors = {
  light: {
    primary: "#007AFF",
    background: "#FFFFFF",
    cardBackground: "#F5F5F5",
    text: "#11181C",
    border: "#D0D0D0",
    success: "#34C759",
    warning: "#FF9500",
    error: "#FF3B30",
  },
  dark: {
    primary: "#0a7ea4",
    background: "#151718",
    cardBackground: "#1D3D47",
    text: "#ECEDEE",
    border: "#687076",
    success: "#34C759",
    warning: "#FF9500",
    error: "#FF3B30",
  },
};

export const getColors = (isDark: boolean) => {
  return isDark ? AppColors.dark : AppColors.light;
};
