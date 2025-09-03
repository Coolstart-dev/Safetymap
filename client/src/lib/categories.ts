export const categories = {
  harassment: {
    name: "Personal Harassment",
    color: "#ef4444",
    subcategories: ["Physical aggression", "Unwanted behavior", "Threats"]
  },
  suspicious: {
    name: "Suspicious Activity", 
    color: "#f97316",
    subcategories: ["Strange behavior", "Suspicious noises"]
  },
  dangerous: {
    name: "Dangerous Situation",
    color: "#dc2626", 
    subcategories: ["Objects blocking road", "Slippery surfaces", "Dangerous animals", "Other"]
  },
  degradation: {
    name: "Public Space Degradation",
    color: "#8b5cf6",
    subcategories: ["Littering", "Illegal dumping", "Nighttime noise", "Dog fouling", "Graffiti", "Vandalism"]
  },
  theft: {
    name: "Theft & Vandalism",
    color: "#06b6d4",
    subcategories: ["Bike theft", "Property damage", "Porch piracy", "Pickpocketing"]
  },
  cyber: {
    name: "Cybercrime",
    color: "#ec4899", 
    subcategories: ["Online threats", "Identity theft", "Fraud"]
  }
} as const;

export type CategoryKey = keyof typeof categories;
