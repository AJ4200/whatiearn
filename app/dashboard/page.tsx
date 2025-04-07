"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, DollarSign, PieChart } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const [clockedIn, setClockedIn] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [currentTimeLog, setCurrentTimeLog] = useState<any>(null);
  const [todayStats, setTodayStats] = useState({
    hoursWorked: 0,
    earnings: 0,
    breaksTotal: 0
  });

  useEffect(() => {
    fetchCurrentStatus();
    fetchTodayStats();
  }, []);

  async function fetchCurrentStatus() {
    try {
      const res = await fetch('/api/time/current-status');
      const data = await res.json();
      setClockedIn(data.clockedIn);
      setOnBreak(data.onBreak);
      setCurrentTimeLog(data.currentTimeLog);
    } catch (error) {
      toast.error('Failed to fetch current status');
    }
  }

  async function fetchTodayStats() {
    try {
      const res = await fetch('/api/time/today-stats');
      const data = await res.json();
      setTodayStats(data);
    } catch (error) {
      toast.error('Failed to fetch today\'s statistics');
    }
  }

  async function handleClockInOut() {
    try {
      const res = await fetch('/api/time/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: clockedIn ? 'out' : 'in' }),
      });

      if (!res.ok) throw new Error('Failed to clock in/out');

      setClockedIn(!clockedIn);
      fetchTodayStats();
      toast.success(clockedIn ? 'Clocked out successfully' : 'Clocked in successfully');
    } catch (error) {
      toast.error('Failed to clock in/out');
    }
  }

  async function handleBreak() {
    try {
      const res = await fetch('/api/time/break', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: onBreak ? 'end' : 'start' }),
      });

      if (!res.ok) throw new Error('Failed to manage break');

      setOnBreak(!onBreak);
      fetchTodayStats();
      toast.success(onBreak ? 'Break ended' : 'Break started');
    } catch (error) {
      toast.error('Failed to manage break');
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Hours Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.hoursWorked.toFixed(2)}h</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${todayStats.earnings.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Break Time</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.breaksTotal}min</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clockedIn ? (onBreak ? 'On Break' : 'Working') : 'Off Work'}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mb-8">
          <Button
            size="lg"
            onClick={handleClockInOut}
            variant={clockedIn ? "destructive" : "default"}
          >
            {clockedIn ? 'Clock Out' : 'Clock In'}
          </Button>
          
          {clockedIn && (
            <Button
              size="lg"
              onClick={handleBreak}
              variant={onBreak ? "destructive" : "secondary"}
              disabled={!clockedIn}
            >
              {onBreak ? 'End Break' : 'Start Break'}
            </Button>
          )}
        </div>

        {currentTimeLog && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clock In:</span>
                  <span>{format(new Date(currentTimeLog.clockIn), 'HH:mm:ss')}</span>
                </div>
                {currentTimeLog.breakStart && !currentTimeLog.breakEnd && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Break Started:</span>
                    <span>{format(new Date(currentTimeLog.breakStart), 'HH:mm:ss')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}