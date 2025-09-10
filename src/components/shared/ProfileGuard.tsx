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
        if (!user.username) {
          console.log("User has no username in Clerk, needs setup");
          setNeedsProfileSetup(true);
          setIsChecking(false);
          return;
        }
        const response = await fetch(`/api/user/profile-status?clerkId=${user.id}`);
        if (!response.ok) {
          console.error("Failed to fetch profile status");
          setNeedsProfileSetup(true);
          setIsChecking(false);
          return;
        }

        const data = await response.json();
        console.log("Profile status data:", data);

        const needsSetup = !data.profileCompleted || !data.username;
        setNeedsProfileSetup(needsSetup);
        
      } catch (error) {
        console.error('Error checking profile status:', error);
        setNeedsProfileSetup(true);
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

  if (!isLoaded || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }
  if (needsProfileSetup) {
    return <UsernameSetup onComplete={handleProfileComplete} />;
  }
  return <>{children}</>;
};

export default ProfileSetupGuard;