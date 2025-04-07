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

    // Generate CSV content
    const csvRows = [
      ['Date', 'Clock In', 'Clock Out', 'Break Start', 'Break End', 'Hours Worked', 'Earnings', 'Holiday'],
    ];

    timeLogs.forEach(log => {
      const clockOut = log.clockOut || '';
      const breakStart = log.breakStart || '';
      const breakEnd = log.breakEnd || '';
      
      let minutes = log.clockOut
        ? differenceInMinutes(new Date(log.clockOut), new Date(log.clockIn))
        : 0;

      if (log.breakStart && log.breakEnd) {
        minutes -= differenceInMinutes(new Date(log.breakEnd), new Date(log.breakStart));
      }

      const hours = minutes / 60;
      const earnings = hours * 15; // Base rate of $15/hour

      csvRows.push([
        format(new Date(log.clockIn), 'yyyy-MM-dd'),
        format(new Date(log.clockIn), 'HH:mm:ss'),
        clockOut ? format(new Date(clockOut), 'HH:mm:ss') : '',
        breakStart ? format(new Date(breakStart), 'HH:mm:ss') : '',
        breakEnd ? format(new Date(breakEnd), 'HH:mm:ss') : '',
        hours.toFixed(2),
        earnings.toFixed(2),
        log.isHoliday ? 'Yes' : 'No',
      ]);
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="timesheet-${period}-${format(now, 'yyyy-MM-dd')}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}