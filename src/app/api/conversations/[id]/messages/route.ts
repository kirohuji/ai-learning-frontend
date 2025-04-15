import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { content } = await request.json();

    // Create a ReadableStream for streaming the response
    const stream = new ReadableStream({
      async start(controller) {
        // Simulate AI response streaming
        const response = "This is a simulated AI response to: " + content;
        const chunks = response.split(" ");

        for (const chunk of chunks) {
          controller.enqueue(chunk + " ");
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
