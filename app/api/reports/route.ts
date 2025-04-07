import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
  differenceInMinutes,
  eachDayOfInterval,
} from 'date-fns';

export async function GET(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
    }

    const timeLogs = await db.timeLog.findMany({
      where: {
        userId: user.id,
        clockIn: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        clockIn: 'asc',
      },
    });

    // Calculate daily totals
    const dailyData = new Map();
    timeLogs.forEach(log => {
      const date = format(new Date(log.clockIn), 'yyyy-MM-dd');
      const clockOut = log.clockOut || new Date();
      let minutes = differenceInMinutes(clockOut, log.clockIn);

      // Subtract break time if any
      if (log.breakStart && log.breakEnd) {
        minutes -= differenceInMinutes(log.breakEnd, log.breakStart);
      }

      const hours = minutes / 60;
      const earnings = hours * 15; // Base rate of $15/hour

      if (dailyData.has(date)) {
        const current = dailyData.get(date);
        dailyData.set(date, {
          hours: current.hours + hours,
          earnings: current.earnings + earnings,
        });
      } else {
        dailyData.set(date, { hours, earnings });
      }
    });

    // Fill in missing dates with zeros
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });
    const data = allDates.map(date => {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const dayData = dailyData.get(formattedDate) || { hours: 0, earnings: 0 };
      return {
        date: format(date, 'MMM dd'),
        hours: Number(dayData.hours.toFixed(2)),
        earnings: Number(dayData.earnings.toFixed(2)),
      };
    });

    // Calculate summary statistics
    const totalHours = Array.from(dailyData.values()).reduce((sum, day) => sum + day.hours, 0);
    const totalEarnings = Array.from(dailyData.values()).reduce((sum, day) => sum + day.earnings, 0);
    const totalDays = dailyData.size;
    const averageHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;

    return NextResponse.json({
      data,
      summary: {
        totalHours,
        totalEarnings,
        averageHoursPerDay,
        totalDays,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}