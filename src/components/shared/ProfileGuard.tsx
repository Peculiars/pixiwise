"use client";
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import UsernameSetup from './UsernameSetup';

const ProfileSetupGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!isLoaded || !user) {
        setIsChecking(false);
        return;
      }

      try {
        const hasUsername = user.username;
        if (!hasUsername) {
          const response = await fetch(`/api/user/profile-status?clerkId=${user.id}`);
          const data = await response.json();
          setNeedsProfileSetup(!data.profileCompleted || !data.username);
        } else {
          setNeedsProfileSetup(false);
        }
      } catch (error) {
        console.error('Error checking profile status:', error);
        setNeedsProfileSetup(!user.username);
      } finally {
        setIsChecking(false);
      }
    };

    checkProfileStatus();
  }, [user, isLoaded]);

  const handleProfileComplete = () => {
    setNeedsProfileSetup(false);
    window.location.reload();
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (needsProfileSetup) {
    return <UsernameSetup onComplete={handleProfileComplete} />;
  }

  return children;
};

export default ProfileSetupGuard;