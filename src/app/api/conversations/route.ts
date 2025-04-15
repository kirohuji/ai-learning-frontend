import { NextResponse } from "next/server";

// Mock data for conversations
const mockConversations = [
  {
    id: "1",
    title: "First Conversation",
    lastMessage: "Hello, how can I help you?",
    updatedAt: "2024-02-15T10:00:00Z",
  },
  {
    id: "2",
    title: "Second Conversation",
    lastMessage: "What's your question?",
    updatedAt: "2024-02-15T11:00:00Z",
  },
];

export async function GET(request: Request) {
  try {
    // TODO: Implement actual authentication and data fetching
    return NextResponse.json(mockConversations);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { title, context } = await request.json();

    // TODO: Implement actual conversation creation
    const newConversation = {
      id: Date.now().toString(),
      title,
      lastMessage: context,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(newConversation, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
