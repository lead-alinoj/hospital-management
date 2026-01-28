export interface Shift {
  _id?: string;
  name: string;              // Morning, Night
  startTime: string;         // 08:00
  endTime: string;           // 20:00
  isOvernight: boolean;      // true for night
  fullDayMinutes: number;    // 480
  halfDayMinutes: number;    // 240
  maxMinutes: number;        // 720
  active: boolean;
}
