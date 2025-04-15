import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json();

    // TODO: Implement actual verification logic
    // For now, we'll just simulate a successful response
    if (code === "123456") {
      return NextResponse.json(
        {
          token: "dummy-token",
          refresh_token: "dummy-refresh-token",
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: "Invalid verification code" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
