"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { conversationApi, authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Menu, Search, Trash2, LogOut } from "lucide-react";
import { Conversation, UserProfile } from "@/types/api";
import { LoadingSpinner } from "@/components/ui/loading";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchConversations();
    fetchUserProfile();
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
      const response = await conversationApi.getConversations();
      if (response.data) {
        setConversations(response.data.list);
        setFilteredConversations(response.data.list);
      }
    } catch (error) {
      console.error("获取会话列表失败:", error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await authApi.getUserProfile();
      if (response.success) {
        setUserProfile(response.data);
      }
    } catch (error) {
      console.error("获取用户信息失败:", error);
    }
  };

  const handleCreateConversation = async () => {
    try {
      const response = await conversationApi.createConversation("新对话", "");
      router.push(`/chat/${response.id}`);
      setIsSidebarOpen(false);
    } catch (error) {
      console.error("创建会话失败:", error);
    }
  };

  const handleConversationClick = async (id: string) => {
    if (pathname === `/chat/${id}`) return;
    setIsLoading(true);
    setIsSidebarOpen(false);
    try {
      await router.push(`/chat/${id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发会话点击
    if (window.confirm("确定要删除这个会话吗？")) {
      try {
        await conversationApi.deleteConversation(id);
        setConversations(conversations.filter((conv) => conv.id !== id));
        setFilteredConversations(
          filteredConversations.filter((conv) => conv.id !== id)
        );
        if (pathname === `/chat/${id}`) {
          router.push("/chat");
        }
      } catch (error) {
        console.error("删除会话失败:", error);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="flex h-16 items-center justify-between border-b px-4 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">AI 助手</h1>
        <div className="w-10" /> {/* 占位，保持标题居中 */}
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col border-r">
          <div className="flex-1 overflow-y-auto p-4">
            <Button className="mb-4 w-full" onClick={handleCreateConversation}>
              新建对话
            </Button>
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="搜索对话..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="space-y-2">
              {filteredConversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    pathname === `/chat/${conversation.id}` ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{conversation.title}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(conversation.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-red-500"
                        onClick={(e) =>
                          handleDeleteConversation(conversation.id, e)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          {/* User Profile Section */}
          <div className="border-t bg-gray-50 p-4 dark:bg-gray-800">
            {userProfile && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={userProfile.avatar || undefined}
                      alt={userProfile.name || userProfile.phone}
                    />
                    <AvatarFallback className="bg-primary text-white">
                      {userProfile.name?.charAt(0) ||
                        userProfile.phone.slice(-2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {userProfile.name || `用户${userProfile.phone.slice(-4)}`}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {userProfile.phone}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  onClick={handleLogout}
                  title="退出登录"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          children
        )}
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
