export interface Transaction {
  _id?: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
}

export interface Subscription {
  serviceName: string;
  amount: number;
  frequency: number;
  monthlyEstimate: number;
  annualEstimate: number;
  lastCharge: string;
  transactions: string[];
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface TimelineData {
  date: string;
  amount: number;
  dateFormatted: string;
}

export interface WeekdayData {
  day: string;
  amount: number;
  average: number;
}
