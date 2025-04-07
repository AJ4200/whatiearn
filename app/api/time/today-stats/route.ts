import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { differenceInMinutes, startOfDay, endOfDay } from 'date-fns';

const BASE_RATE = 15; // $15 per hour
const OVERTIME_MULTIPLIER = 1.5;
const HOLIDAY_MULTIPLIER = 2.0;

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const timeLogs = await db.timeLog.findMany({
      where: {
        userId: user.id,
        clockIn: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    let totalMinutes = 0;
    let breakMinutes = 0;

    timeLogs.forEach(log => {
      const clockOut = log.clockOut || new Date();
      totalMinutes += differenceInMinutes(clockOut, log.clockIn);

      if (log.breakStart && log.breakEnd) {
        breakMinutes += differenceInMinutes(log.breakEnd, log.breakStart);
      } else if (log.breakStart) {
        breakMinutes += differenceInMinutes(new Date(), log.breakStart);
      }
    });

    const workMinutes = totalMinutes - breakMinutes;
    const hoursWorked = workMinutes / 60;
    
    // Calculate earnings with multipliers
    let earnings = hoursWorked * BASE_RATE;
    if (hoursWorked > 8) {
      const overtimeHours = hoursWorked - 8;
      earnings = (8 * BASE_RATE) + (overtimeHours * BASE_RATE * OVERTIME_MULTIPLIER);
    }
    
    // Apply holiday multiplier if applicable
    const isHoliday = timeLogs.some(log => log.isHoliday);
    if (isHoliday) {
      earnings *= HOLIDAY_MULTIPLIER;
    }

    return NextResponse.json({
      hoursWorked,
      earnings,
      breaksTotal: breakMinutes,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}