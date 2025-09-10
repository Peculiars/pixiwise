import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import User from "@/lib/models/user.model";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username || username.length < 3) {
      return NextResponse.json({ 
        available: false, 
        message: "Username must be at least 3 characters" 
      });
    }

    await connectToDatabase();
    const existingUser = await User.findOne({ 
      username: username.toLowerCase() 
    });

    return NextResponse.json({ 
      available: !existingUser,
      message: existingUser ? "Username is already taken" : "Username is available"
    });

  } catch (error) {
    console.error("Error checking username:", error);
    return NextResponse.json({ 
      available: false, 
      message: "Error checking username" 
    }, { status: 500 });
  }
}