"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { conversationApi, authApi } from "@/lib/api";
import { Conversation, UserProfile } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Trash2, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "刚刚";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}小时前`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}天前`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}个月前`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}年前`;
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<
    Conversation[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserProfile | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const { data } = await authApi.getUserProfile();
        setUserInfo(data);
      } catch (error) {
        console.error("获取用户信息失败:", error);
      }
    };

    fetchUserProfile();
    fetchConversations();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = conversations.filter((conv) =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const fetchConversations = async () => {
    try {
      setError("");
      setLoading(true);
      const { data } = await conversationApi.getConversations();
      setConversations(data.list);
      setFilteredConversations(data.list);
    } catch (error: any) {
      setError(error.response?.data?.message || "获取对话列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    try {
      setError("");
      const response = await conversationApi.createConversation("新对话", "");
      setConversations((prev) => [response, ...prev]);
      setFilteredConversations((prev) => [response, ...prev]);
      router.push(`/chat/${response.id}`);
    } catch (error: any) {
      setError(error.response?.data?.message || "创建对话失败");
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("确定要删除这个对话吗？")) return;

    try {
      setError("");
      await conversationApi.deleteConversation(id);
      setConversations((prev) => prev.filter((conv) => conv.id !== id));
      setFilteredConversations((prev) => prev.filter((conv) => conv.id !== id));
      if (pathname === `/chat/${id}`) {
        router.push("/chat");
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "删除对话失败");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="flex h-screen">
      <div className="flex w-64 flex-col border-r bg-gray-50">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">对话列表</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateConversation}
              disabled={loading}
            >
              新建对话
            </Button>
          </div>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="搜索对话..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500">
              {error}
            </div>
          )}
          <div className="space-y-2">
            {filteredConversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`group cursor-pointer transition-colors hover:bg-gray-100 ${
                  pathname === `/chat/${conversation.id}` ? "bg-gray-100" : ""
                }`}
                onClick={() => router.push(`/chat/${conversation.id}`)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium">{conversation.title}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) =>
                        handleDeleteConversation(conversation.id, e)
                      }
                    >
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatTimeAgo(conversation.createdAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={userInfo?.avatar || undefined}
                  alt={userInfo?.phone || "用户"}
                />
                <AvatarFallback>
                  {userInfo?.phone ? userInfo.phone.slice(-2) : "用户"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {userInfo?.phone || "用户"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
