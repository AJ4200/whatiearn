import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const holidays = await db.holiday.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(holidays);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { date, name, multiplier } = await request.json();

    const holiday = await db.holiday.create({
      data: {
        userId: user.id,
        date: new Date(date),
        name,
        multiplier,
      },
    });

    return NextResponse.json(holiday, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}