import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import User from "@/lib/models/user.model";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const { userId } = await auth();

    if (!username) {
      return NextResponse.json({ 
        available: false, 
        message: "Username is required" 
      }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ 
        available: false, 
        message: "Username must be at least 3 characters" 
      });
    }

    if (username.length > 20) {
      return NextResponse.json({ 
        available: false, 
        message: "Username must be less than 20 characters" 
      });
    }

    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ 
        available: false, 
        message: "Username can only contain lowercase letters, numbers, and underscores" 
      });
    }

    const reservedUsernames = ['admin', 'api', 'www', 'mail', 'root', 'support', 'help', 'about', 'contact'];
    if (reservedUsernames.includes(username.toLowerCase())) {
      return NextResponse.json({ 
        available: false, 
        message: "This username is reserved" 
      });
    }

    await connectToDatabase();

    const query: { username: string; [key: string]: any } = { username: username.toLowerCase() };
    if (userId) {
      query.clerkId = { $ne: userId };
    }
    
    const existingUser = await User.findOne(query);

    const available = !existingUser;
    
    return NextResponse.json({ 
      available,
      message: available ? "Username is available" : "Username is already taken"
    });

  } catch (error) {
    console.error("Error checking username:", error);
    return NextResponse.json({ 
      available: false, 
      message: "Error checking username" 
    }, { status: 500 });
  }
}