import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { updateUser } from "@/lib/actions/user.actions";
import { connectToDatabase } from "@/lib/database/mongoose";
import User from "@/lib/models/user.model";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { clerkId, username } = await req.json();
    
    if (userId !== clerkId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (!username || username.length < 3) {
      return NextResponse.json({ 
        message: "Username must be at least 3 characters" 
      }, { status: 400 });
    }

    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ 
        message: "Username can only contain lowercase letters, numbers, and underscores" 
      }, { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ 
      username: username.toLowerCase(),
      clerkId: { $ne: clerkId } 
    });

    if (existingUser) {
      return NextResponse.json({ 
        message: "Username already exists" 
      }, { status: 400 });
    }

    const currentUser = await User.findOne({ clerkId });
    
    if (!currentUser) {
      return NextResponse.json({ 
        message: "User not found" 
      }, { status: 404 });
    }

    try {
      const clerk = await clerkClient();
      await clerk.users.updateUser(clerkId, {
        username: username.toLowerCase()
      });
      console.log("✅ Clerk username updated successfully");
    } catch (clerkError: any) {
      console.warn("⚠️ Could not update username in Clerk:", clerkError.message);
    }

    const updatedUser = await updateUser(clerkId, { 
      username: username.toLowerCase(),
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      photo: currentUser.photo,
      profileCompleted: true
    });

    return NextResponse.json({ 
      message: "Username updated successfully", 
      user: updatedUser 
    });

  } catch (error: any) {
    console.error("Error updating username:", error);
    
    if (error.code === 11000) {
      return NextResponse.json({ 
        message: "Username already exists" 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}