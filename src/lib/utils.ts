import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function calculateCGPA(grades: any[]) {
    if (!grades || grades.length === 0) return 0;

    let totalPoints = 0;
    let totalUnits = 0;

    grades.forEach((grade) => {
        const units = parseInt(grade.creditUnits) || 0;
        let points = 0;

        switch (grade.grade.toUpperCase()) {
            case "A": points = 5; break;
            case "B": points = 4; break;
            case "C": points = 3; break;
            case "D": points = 2; break;
            case "E": points = 1; break;
            case "F": points = 0; break;
            default: points = 0;
        }

        totalPoints += points * units;
        totalUnits += units;
    });

    return totalUnits === 0 ? 0 : parseFloat((totalPoints / totalUnits).toFixed(2));
}
