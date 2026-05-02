const NUTRITION_STATUS_MAP: Record<string, string> = {
  Normal: "Normal",
  Stunted: "Pendek (Stunting)",
  "Severely Stunted": "Sangat Pendek (Stunting Berat)",
  Underweight: "Berat Badan Kurang",
  "Severely Underweight": "Berat Badan Sangat Kurang",
  Overweight: "Berat Badan Berlebih",
  "Possible risk of overweight": "Berisiko Berat Badan Berlebih",
  Wasted: "Gizi Kurang",
  "Severely Wasted": "Gizi Buruk",
};

export function toIndonesianNutritionStatus(status: string | null | undefined): string {
  if (!status) return "-";
  return NUTRITION_STATUS_MAP[status] ?? status;
}

export function toIndonesianNutritionAlert(alertText: string): string {
  const [prefix, rawStatus] = alertText.split(":");
  if (!rawStatus) {
    return toIndonesianNutritionStatus(alertText);
  }

  const translated = toIndonesianNutritionStatus(rawStatus.trim());
  return `${prefix}: ${translated}`;
}
