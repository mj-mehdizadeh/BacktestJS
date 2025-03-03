
export const percentage = (high: number, low: number) => +(100 * (high - low) / high).toFixed(1);
