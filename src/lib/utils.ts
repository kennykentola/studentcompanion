import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function calculateCGPA(grades: any[], scale: '5.0' | '4.0' = '5.0') {
    if (!grades || grades.length === 0) return 0;

    let totalPoints = 0;
    let totalUnits = 0;

    grades.forEach((grade) => {
        const units = parseInt(grade.creditUnits) || 0;
        let points = 0;

        const g = grade.grade.toUpperCase();

        if (scale === '5.0') {
            switch (g) {
                case "A": points = 5; break;
                case "B": points = 4; break;
                case "C": points = 3; break;
                case "D": points = 2; break;
                case "E": points = 1; break;
                case "F": points = 0; break;
                default: points = 0;
            }
        } else {
            // 4.0 Scale (e.g. UI)
            switch (g) {
                case "A": points = 4; break;
                case "B": points = 3; break;
                case "C": points = 2; break;
                case "D": points = 1; break;
                case "E": points = 0; break; // Assumed E is fail in 4.0 or just 0
                case "F": points = 0; break;
                default: points = 0;
            }
        }

        totalPoints += points * units;
        totalUnits += units;
    });

    return totalUnits === 0 ? 0 : parseFloat((totalPoints / totalUnits).toFixed(2));
}
