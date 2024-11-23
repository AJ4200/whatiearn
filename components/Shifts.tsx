"use client";
import { Shift } from "@prisma/client";
import { useState, useEffect } from "react";

export default function Shifts() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchShifts = async () => {
      setLoading(true);
      setError("");

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!user || !user.id) {
        setError("User not found.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/get-shifts", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "user-id": user.id.toString(),
          },
        });

        if (response.ok) {
          const data = await response.json();
          setShifts(data); // Store shifts data in state
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Failed to load shifts");
        }
      } catch (error) {
        setError("An unexpected error occurred.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, []);

  return (
    <div>
      {loading ? (
        <p>Loading shifts...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <div>
          <h2>Your Shifts</h2>
          <ul>
            {shifts.map((shift: Shift) => (
              <li key={shift.id}>
                <p>Date: {new Date(shift.date).toLocaleDateString()}</p>
                <p>
                  Clock In:{" "}
                  {shift.clockIn
                    ? new Date(shift.clockIn).toLocaleTimeString()
                    : "N/A"}
                </p>
                <p>
                  Clock Out:{" "}
                  {shift.clockOut
                    ? new Date(shift.clockOut).toLocaleTimeString()
                    : "N/A"}
                </p>
                <p>
                  Break Start:{" "}
                  {shift.breakStart
                    ? new Date(shift.breakStart).toLocaleTimeString()
                    : "N/A"}
                </p>
                <p>
                  Break End:{" "}
                  {shift.breakEnd
                    ? new Date(shift.breakEnd).toLocaleTimeString()
                    : "N/A"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
