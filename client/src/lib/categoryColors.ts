import { type Categories } from "./categories";

// Category color mappings for Tailwind CSS classes
export const getCategoryColorClasses = (category: string) => {
  const categoryMapping = {
    harassment: {
      bg: "bg-category-harassment",
      bgLight: "bg-category-harassment/20",
      text: "text-category-harassment",
      border: "border-category-harassment",
    },
    suspicious: {
      bg: "bg-category-suspicious", 
      bgLight: "bg-category-suspicious/20",
      text: "text-category-suspicious",
      border: "border-category-suspicious",
    },
    public: {
      bg: "bg-category-public",
      bgLight: "bg-category-public/20", 
      text: "text-category-public",
      border: "border-category-public",
    },
    theft: {
      bg: "bg-category-theft",
      bgLight: "bg-category-theft/20",
      text: "text-category-theft", 
      border: "border-category-theft",
    },
    dangerous: {
      bg: "bg-category-dangerous",
      bgLight: "bg-category-dangerous/20",
      text: "text-category-dangerous",
      border: "border-category-dangerous",
    },
    status: {
      bg: "bg-category-status",
      bgLight: "bg-category-status/20", 
      text: "text-category-status",
      border: "border-category-status",
    },
  };

  return categoryMapping[category as keyof typeof categoryMapping] || {
    bg: "bg-muted",
    bgLight: "bg-muted/20",
    text: "text-muted-foreground", 
    border: "border-muted",
  };
};

// Legacy support - returns CSS variable value for inline styles
export const getCategoryColorValue = (category: string) => {
  const colorMapping = {
    harassment: "var(--category-harassment)",
    suspicious: "var(--category-suspicious)", 
    public: "var(--category-public)",
    theft: "var(--category-theft)",
    dangerous: "var(--category-dangerous)",
    status: "var(--category-status)",
  };

  return colorMapping[category as keyof typeof colorMapping] || "var(--muted-foreground)";
};