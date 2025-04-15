import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    // TODO: Implement actual SMS sending logic
    // For now, we'll just simulate a successful response
    return NextResponse.json(
      { message: "Verification code sent successfully" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
