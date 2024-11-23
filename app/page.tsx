"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Clock, Play, Pause, LogOut, Loader2 } from 'lucide-react';

// Helper function to create a new user
const createUser = async (name: string) => {
  try {
    const response = await fetch("/api/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error("Error creating user");
    }

    const data = await response.json();
    return data.userId; // Return user ID after user creation
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [userName, setUserName] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserId(parsedUser.id);
    } else {
      setShowModal(true); // Show modal if user is not found
    }

    // Set up the real-time clock
    const updateDateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { weekday: "long" };
      const dayName = now.toLocaleDateString("en-US", options);
      const formattedDateTime = `${dayName}, ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
      setCurrentDateTime(formattedDateTime);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: string) => {
    if (!userId) {
      setMessage("User is not logged in.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/shift-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`Action '${action}' completed successfully!`);
        console.log(data);
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.message}`);
      }
    } catch (error) {
      setMessage("An unexpected error occurred.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async () => {
    if (!userName.trim()) {
      setMessage("Please enter a valid name.");
      return;
    }

    const newUserId = await createUser(userName);
    if (newUserId) {
      setUserId(newUserId);
      localStorage.setItem(
        "user",
        JSON.stringify({ id: newUserId, name: userName })
      );
      setShowModal(false); // Close the modal after successful user creation
      setMessage(`Welcome, ${userName}!`);
    } else {
      setMessage("Error creating user.");
    }
  };

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 text-white">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      <main className="relative z-10 flex flex-col gap-8 items-center sm:items-start max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center sm:text-left bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          WhatIEarn ⏰💰
        </h1>
        <p className="text-xl text-center sm:text-left text-blue-200">
          {currentDateTime}
        </p>

        <div className="flex flex-col gap-4 items-center sm:items-start w-full max-w-md">
          <button
            className="rounded-full bg-green-500 text-white text-lg h-14 px-8 w-full transition-all hover:bg-green-600 hover:shadow-lg hover:scale-105"
            onClick={() => handleAction("CLOCK_IN")}
            disabled={loading}
          >
            <Clock/>{"Clock In"}
          </button>
          <p className="font-semibold text-lg">Break</p>
          <div className="flex gap-4 w-full">
            <button
              className="rounded-full bg-blue-500 text-white text-lg h-14 px-8 flex-1 transition-all hover:bg-blue-600 hover:shadow-lg hover:scale-105"
              onClick={() => handleAction("START_BREAK")}
              disabled={loading}
            >
              <Play/>{"Start"}
            </button>
            <button
              className="rounded-full bg-yellow-500 text-white text-lg h-14 px-8 flex-1 transition-all hover:bg-yellow-600 hover:shadow-lg hover:scale-105"
              onClick={() => handleAction("END_BREAK")}
              disabled={loading}
            >
              <Pause/>{"End"}
            </button>
          </div>
          <button
            className="rounded-full bg-red-500 text-white text-lg h-14 px-8 w-full transition-all hover:bg-red-600 hover:shadow-lg hover:scale-105"
            onClick={() => handleAction("CLOCK_OUT")}
            disabled={loading}
          >
            <LogOut/>{"Clock Out"}
          </button>
        </div>

        {message && (
          <p className="mt-4 text-lg text-center sm:text-left text-blue-200">
            {message}
          </p>
        )}
      </main>
{loading ? <div className="fixed inset-0 bg-black bg-opacity-80 z-100 flex justify-center items-center">
<Loader2/>
</div > : ""}
      {/* Modal for creating a new user */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Welcome, New User!</h3>

            <input
              type="text"
              className="border border-gray-300 p-3 mb-6 w-full rounded-lg text-gray-800"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
            <button
              className="rounded-full bg-blue-500 text-white text-lg h-12 px-6 w-full transition-all hover:bg-blue-600 hover:shadow-lg"
              onClick={handleUserSubmit}
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      <footer className="relative z-10 mt-16 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors"
          href="https://github.com/aj4200/whatiearn"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="GitHub"
            width={20}
            height={20}
            className="invert"
          />
          GitHub Repo
        </a>
      </footer>
    </div>
  );
}
