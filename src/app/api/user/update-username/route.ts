import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateUser } from "@/lib/actions/user.actions";

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

    const updatedUser = await updateUser(clerkId, { 
      username, 
        firstName: "",
        lastName: "",
        photo: "",
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
      message: "Internal server error" 
    }, { status: 500 });
  }
}