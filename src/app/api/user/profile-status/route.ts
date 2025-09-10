import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import User from "@/lib/models/user.model";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get('clerkId');

    if (!clerkId) {
      return NextResponse.json({ 
        message: "Clerk ID is required" 
      }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ clerkId });

    if (!user) {
      return NextResponse.json({ 
        profileCompleted: false,
        username: null,
        message: "User not found"
      });
    }

    return NextResponse.json({ 
      profileCompleted: user.profileCompleted || false,
      username: user.username,
      hasUsername: !!user.username
    });

  } catch (error) {
    console.error("Error checking profile status:", error);
    return NextResponse.json({ 
      profileCompleted: false,
      username: null,
      message: "Error checking profile status" 
    }, { status: 500 });
  }
}