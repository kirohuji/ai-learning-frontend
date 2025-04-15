"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { conversationApi } from "@/lib/api";
import { ChatMessage } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatDetailPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchMessages();
  }, [params.id]);

  const fetchMessages = async () => {
    try {
      setError("");
      setLoading(true);
      const response = await conversationApi.getMessages(params.id);
      console.log("data", response);

      if (response.success && response.data.messages) {
        setMessages(response.data.messages);
      }
    } catch (error: any) {
      setError(error.message || "获取消息失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const newMessage: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
      isStreamed: false,
    };
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");

    try {
      setError("");
      setLoading(true);
      setIsStreaming(true);
      const controller = new AbortController();
      const { signal } = controller;
      const requestOptions = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      };

      let assistantMessage: ChatMessage = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        isStreamed: false,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      await fetchEventSource(
        `${process.env.NEXT_PUBLIC_API_URL}/conversations/${params.id}/message?message=${message}`,
        {
          openWhenHidden: true,
          ...requestOptions,
          signal,
          async onmessage(msg) {
            if (msg.data) {
              const msgData = JSON.parse(msg.data);
              if (msgData.data !== "[DONE]") {
                assistantMessage.content += msgData.data;
                setMessages((prev) => [
                  ...prev.slice(0, -1),
                  { ...assistantMessage },
                ]);
              }
            }
          },
          onerror(err) {
            console.error("EventSource 失败:", err);
            controller.abort();
          },
          onclose() {
            setIsStreaming(false);
          },
        }
      );
    } catch (error: any) {
      setError(error.message || "发送消息失败");
      setIsStreaming(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`group relative mb-8 flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-[hsl(0,100%,99.2%)] text-gray-900 shadow-sm max-w-[80%] md:max-w-[80%]"
                    : "text-gray-900 max-w-[100%] md:max-w-[80%]"
                }`}
              >
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                <div
                  className={`mt-2 text-xs ${
                    msg.role === "user" ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleString()}
                  {isStreaming &&
                    index === messages.length - 1 &&
                    msg.role === "assistant" && (
                      <span className="ml-2 inline-flex items-center">
                        <svg
                          className="mr-1 h-3 w-3 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        正在输入...
                      </span>
                    )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="border-t bg-white px-1 py-1 dark:bg-gray-800">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
            <Textarea
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setMessage(e.target.value)
              }
              placeholder="输入消息..."
              disabled={loading}
              className="min-h-[60px] resize-none bg-transparent"
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !message.trim()}
              className="h-8 w-8 rounded-full bg-primary p-0 hover:bg-primary/90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </Button>
          </div>
          <div className="mt-2 text-center text-xs text-gray-500">
            按 Enter 发送消息，Shift + Enter 换行
          </div>
        </div>
      </div>
    </div>
  );
}
