"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SmsLoginRequest,
  SendVerificationCodeRequest,
  RegisterRequest,
} from "@/types/api";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Clear countdown timer when component unmounts
    return () => {
      setCountdown(0);
    };
  }, []);

  const handleSendCode = async () => {
    try {
      setError("");
      setLoading(true);
      const request: SendVerificationCodeRequest = { phone };
      const response = await authApi.sendVerificationCode(request);
      setCode(response.data.verificationCode);
      setStep("code");
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Failed to send verification code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      const request: SmsLoginRequest = { phone, code };
      try {
        const response = await authApi.loginWithSms(request);
        localStorage.setItem("token", response.data.access_token);
        localStorage.setItem("refresh_token", response.data.refresh_token);
        router.push("/chat");
      } catch (loginError: any) {
        if (loginError.response?.status === 404) {
          // 用户不存在，尝试注册
          const registerRequest: RegisterRequest = {
            phone,
            code,
            password: "123456",
            name: `用户${phone.slice(-4)}`,
          };
          const registerResponse = await authApi.register(registerRequest);
          localStorage.setItem("token", registerResponse.data.access_token);
          localStorage.setItem(
            "refresh_token",
            registerResponse.data.refresh_token
          );
          router.push("/chat");
        } else {
          throw loginError;
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "验证码无效");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    if (countdown === 0) {
      handleSendCode();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-center">登录</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500">
              {error}
            </div>
          )}
          {step === "phone" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">手机号</label>
                <Input
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPhone(e.target.value)
                  }
                  disabled={loading}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSendCode}
                disabled={loading || !phone}
              >
                {loading ? "发送中..." : "发送验证码"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">验证码</label>
                <Input
                  type="text"
                  placeholder="请输入验证码"
                  value={code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCode(e.target.value)
                  }
                  disabled={loading}
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>验证码已发送至 {phone}</span>
                  <button
                    onClick={handleResendCode}
                    disabled={countdown > 0}
                    className={`${
                      countdown > 0
                        ? "text-gray-400"
                        : "text-blue-500 hover:text-blue-600"
                    }`}
                  >
                    {countdown > 0 ? `${countdown}秒后重发` : "重新发送"}
                  </button>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleLogin}
                disabled={loading || !code}
              >
                {loading ? "登录中..." : "登录"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
