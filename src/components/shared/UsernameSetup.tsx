"use client";
import User from '@/lib/models/user.model';
import { UserButton } from '@clerk/nextjs';
import React, { useState } from 'react'

interface UsernameSetupProps {
  onComplete: () => void;
}

const UsernameSetup = ({ onComplete }: UsernameSetupProps) => {
  const searchParams = new URLSearchParams(window.location.search);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    const clerkId = searchParams.get('clerkId');
    const user = await User.findOne({ clerkId });
    e?.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Update Clerk user with username
      await user?.update({
        username: username
      });

      // Update your database
      const response = await fetch('/api/user/update-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user?.id,
          username: username
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update username');
      }

      onComplete?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-center">Set Your Username</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                </label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your desired username"
                    required
                />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                >
                Save Username
                </button>
            </form>
            <div className="mt-6 text-center">
                <UserButton afterSignOutUrl="/" />
            </div>
            </div>
        </div>
    </div>
  )
}

export default UsernameSetup