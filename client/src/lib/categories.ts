export const categories = {
  harassment: {
    name: "Personal Harassment",
    color: "#ef4444", // red
    subcategories: [
      "Physical aggression (fighting, restraining)",
      "Unwanted behavior (catcalling, sexual remarks, racism)",
      "Threats",
      "Dangerous animals (e.g., unleashed dogs)"
    ]
  },
  suspicious: {
    name: "Suspicious Activity",
    color: "#eab308", // yellow
    subcategories: [
      "Strange or unusual behavior",
      "Suspicious noises"
    ]
  },
  public: {
    name: "Degradation of Public Spaces",
    color: "#8b5cf6", // purple
    subcategories: [
      "Littering",
      "Illegal dumping",
      "Nighttime noise",
      "Dog fouling",
      "Graffiti",
      "Vandalism"
    ]
  },
  theft: {
    name: "Theft & Vandalism of Private Property",
    color: "#06b6d4", // cyan
    subcategories: [
      "Bike theft",
      "Property damage",
      "Porch piracy",
      "Cybercrime",
      "Pickpocketing"
    ]
  },
  dangerous: {
    name: "Dangerous Situations",
    color: "#f97316", // orange
    subcategories: [
      "Other dangerous situations"
    ]
  },
  status: {
    name: "Status Reports",
    color: "#10b981", // green
    subcategories: [
      "Just status reports"
    ]
  }
} as const;

export type CategoryKey = keyof typeof categories;