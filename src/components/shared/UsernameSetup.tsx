"use client";
import { UserButton, useUser } from '@clerk/nextjs';
import React, { useState } from 'react'

interface UsernameSetupProps {
  onComplete: () => void;
}

const UsernameSetup = ({ onComplete }: UsernameSetupProps) => {
  const { user } = useUser();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) return;

    setIsCheckingAvailability(true);
    try {
      const response = await fetch(`/api/user/check-username?username=${encodeURIComponent(usernameToCheck)}`);
      const data = await response.json();
      
      if (!data.available) {
        setError(data.message);
      } else {
        setError('');
      }
    } catch (err) {
      console.error('Error checking username availability:', err);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(newUsername);
    setError('');

    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(newUsername);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('User not found');
      return;
    }

    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await user.update({
        username: username
      });
      const response = await fetch('/api/user/update-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user.id,
          username: username
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update username');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onComplete();
    } catch (err: any) {
      console.error('Error updating username:', err);
      setError(err.message || 'Failed to update username');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Set Your Username</h2>
        <p className="text-gray-600 text-sm mb-6 text-center">
          Choose a unique username to complete your profile setup
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your desired username"
              minLength={3}
              maxLength={20}
              pattern="[a-z0-9_]+"
              title="Username can only contain lowercase letters, numbers, and underscores"
              required
              disabled={isLoading}
            />
            {isCheckingAvailability && (
              <p className="text-blue-500 text-sm mt-1">Checking availability...</p>
            )}
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={isLoading || isCheckingAvailability || !!error || !username}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Username'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </div>
  )
}

export default UsernameSetup