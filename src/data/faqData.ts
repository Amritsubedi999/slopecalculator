export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is the formula for calculating slope?",
    answer: "The fundamental formula for calculating slope (m) is m = Rise / Run, which represents the vertical change divided by the horizontal change. In coordinate geometry with two points P₁(x₁, y₁) and P₂(x₂, y₂), the formula is m = (y₂ - y₁) / (x₂ - x₁)."
  },
  {
    question: "How do you calculate slope between two points?",
    answer: "To calculate slope between two coordinate points P₁(x₁, y₁) and P₂(x₂, y₂), subtract the first y-coordinate from the second (y₂ - y₁) to obtain the vertical rise, subtract the first x-coordinate from the second (x₂ - x₁) to obtain the horizontal run, and divide the rise by the run: m = (y₂ - y₁) / (x₂ - x₁)."
  },
  {
    question: "What does a negative slope mean?",
    answer: "A negative slope indicates a downward or descending line moving from left to right. As the horizontal position (x) increases, the vertical elevation (y) decreases at a constant rate."
  },
  {
    question: "What is percentage grade?",
    answer: "Percentage grade expresses the steepness of an incline as the vertical rise per 100 units of horizontal run. It is calculated by multiplying the decimal slope by 100: Grade (%) = (Rise / Run) × 100. For example, a slope of 0.05 equals a 5% grade."
  },
  {
    question: "How do you convert slope to degrees?",
    answer: "To convert slope to an angle in degrees, compute the inverse tangent (arctangent) of the slope and multiply by 180 / π: Angle (θ) = arctan(m) × (180 / π). For example, a slope of 1.0 yields arctan(1.0) = 45°."
  },
  {
    question: "What happens when the run is zero?",
    answer: "When the horizontal run (or Δx) equals zero, the line is perfectly vertical. Division by zero is mathematically undefined, meaning a vertical line has no finite slope. Its angle of inclination is exactly 90° (or -90°)."
  },
  {
    question: "Can slope be greater than 100%?",
    answer: "Yes. A 100% grade corresponds to a 45° angle, where vertical rise equals horizontal run (1:1 ratio). Any incline steeper than 45° has a rise greater than its run, resulting in a slope greater than 1.0 and a grade percentage greater than 100% (e.g., a 2:1 slope is 200% grade or ~63.43°)."
  },
  {
    question: "What is the difference between slope and grade?",
    answer: "Slope is typically expressed as a dimensionless decimal ratio (such as 0.25) or a fractional ratio (1:4), whereas grade is that exact same ratio expressed as a percentage (25%). Mathematically, Grade (%) = Slope × 100."
  }
];
