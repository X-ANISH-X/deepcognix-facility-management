// Mock Revenue Data Service
// This provides realistic revenue data for different time periods
// Easy to replace with actual API calls later

export interface DailyRevenue {
  label: string;
  revenue: number;
}

export interface WeeklyRevenue {
  day: string;
  completed: number;
  revenue: number;
}

export interface MonthlyRevenue {
  label: string;
  revenue: number;
}

export interface YearlyRevenue {
  label: string;
  revenue: number;
}

export const mockRevenueData = {
  // Daily revenue data - shows hourly-like breakdown for today
  daily: (): DailyRevenue[] => [
    { label: 'Mon', revenue: 3400 },
    { label: 'Tue', revenue: 4200 },
    { label: 'Wed', revenue: 2800 },
    { label: 'Thu', revenue: 5100 },
    { label: 'Fri', revenue: 3900 },
    { label: 'Sat', revenue: 2200 },
    { label: 'Sun', revenue: 1600 }
  ],

  // Weekly revenue data - shows daily breakdown with completed work orders
  weekly: (): WeeklyRevenue[] => [
    { day: 'Mon', completed: 12, revenue: 3400 },
    { day: 'Tue', completed: 15, revenue: 4200 },
    { day: 'Wed', completed: 10, revenue: 2800 },
    { day: 'Thu', completed: 18, revenue: 5100 },
    { day: 'Fri', completed: 14, revenue: 3900 },
    { day: 'Sat', completed: 8, revenue: 2200 },
    { day: 'Sun', completed: 6, revenue: 1600 }
  ],

  // Monthly revenue data - shows weekly breakdown for the current month
  monthly: (): MonthlyRevenue[] => [
    { label: 'Week 1', revenue: 24300 },
    { label: 'Week 2', revenue: 28400 },
    { label: 'Week 3', revenue: 22900 },
    { label: 'Week 4', revenue: 31200 }
  ],

  // Yearly revenue data - shows monthly breakdown for the year
  yearly: (): YearlyRevenue[] => [
    { label: 'Jan', revenue: 87000 },
    { label: 'Feb', revenue: 92300 },
    { label: 'Mar', revenue: 78500 },
    { label: 'Apr', revenue: 95200 },
    { label: 'May', revenue: 88400 },
    { label: 'Jun', revenue: 102100 },
    { label: 'Jul', revenue: 98700 },
    { label: 'Aug', revenue: 105600 },
    { label: 'Sep', revenue: 91200 },
    { label: 'Oct', revenue: 99800 },
    { label: 'Nov', revenue: 108300 },
    { label: 'Dec', revenue: 115600 }
  ],

  // Calculate total revenue for a given period
  calculateTotal: (period: 'day' | 'week' | 'month' | 'year'): number => {
    switch (period) {
      case 'day': {
        const data = mockRevenueData.daily();
        return data.reduce((sum, item) => sum + item.revenue, 0);
      }
      case 'week': {
        const data = mockRevenueData.weekly();
        return data.reduce((sum, item) => sum + item.revenue, 0);
      }
      case 'month': {
        const data = mockRevenueData.monthly();
        return data.reduce((sum, item) => sum + item.revenue, 0);
      }
      case 'year': {
        const data = mockRevenueData.yearly();
        return data.reduce((sum, item) => sum + item.revenue, 0);
      }
      default:
        return 0;
    }
  },

  // Calculate average revenue per day/week/month
  calculateAverage: (period: 'day' | 'week' | 'month' | 'year'): number => {
    const total = mockRevenueData.calculateTotal(period);
    const dataCount = {
      day: 7,
      week: 7,
      month: 4,
      year: 12
    };
    return Math.round(total / dataCount[period]);
  },

  // Calculate revenue growth percentage
  calculateGrowth: (period: 'day' | 'week' | 'month' | 'year'): number => {
    const data =
      period === 'day'
        ? mockRevenueData.daily()
        : period === 'week'
          ? mockRevenueData.weekly()
          : period === 'month'
            ? mockRevenueData.monthly()
            : mockRevenueData.yearly();

    if (data.length < 2) return 0;

    const firstValue = data[0].revenue;
    const lastValue = data[data.length - 1].revenue;
    const growth = ((lastValue - firstValue) / firstValue) * 100;

    return Math.round(growth * 10) / 10; // Round to 1 decimal place
  },

  // Get peak revenue day/week/month
  getPeakRevenue: (
    period: 'day' | 'week' | 'month' | 'year'
  ): { label: string; revenue: number } => {
    const data =
      period === 'day'
        ? mockRevenueData.daily()
        : period === 'week'
          ? (mockRevenueData.weekly() as any)
          : period === 'month'
            ? mockRevenueData.monthly()
            : mockRevenueData.yearly();

    const result = data.reduce((max: any, current: any) =>
      current.revenue > max.revenue ? current : max
    );

    return {
      label: (result as any).day || (result as any).label || 'N/A',
      revenue: result.revenue
    };
  }
};

// Revenue statistics interface
export interface RevenueStats {
  total: number;
  average: number;
  growth: number;
  peak: { label: string; revenue: number };
}

// Get all statistics for a period
export const getRevenueStats = (period: 'day' | 'week' | 'month' | 'year'): RevenueStats => ({
  total: mockRevenueData.calculateTotal(period),
  average: mockRevenueData.calculateAverage(period),
  growth: mockRevenueData.calculateGrowth(period),
  peak: mockRevenueData.getPeakRevenue(period)
});
