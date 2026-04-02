"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { JDLogo } from "@/components/layout/JDLogo";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@insightx.com");
  const [name, setName] = useState("Admin");
  const [loading, setLoading] = useState(false);

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn("credentials", {
      email,
      name,
      callbackUrl: "/chat",
    });
  };

  const handleMicrosoftLogin = () => {
    signIn("microsoft-entra-id", { callbackUrl: "/chat" });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-white to-yellow-50">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <JDLogo size="lg" />
          </div>

          {/* Welcome text */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-sm text-gray-500">
              Sign in to access InsightX
            </p>
          </div>

          {/* Dev Login Form */}
          <form onSubmit={handleDevLogin} className="space-y-4 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="user@insightx.com"
                required
              />
            </div>
            <p className="text-xs text-gray-400">
              Use <strong>admin@insightx.com</strong> for admin access, any other email for user access.
            </p>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-400">or</span>
            </div>
          </div>

          {/* Microsoft sign in */}
          <Button
            onClick={handleMicrosoftLogin}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            Sign in with Microsoft
          </Button>

          {/* Footer text */}
          <p className="text-center text-xs text-gray-400 mt-6">
            By signing in, you agree to the organization&apos;s data policies and terms of use.
          </p>
        </div>

        {/* Branding footer */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="h-2 w-2 rounded-full bg-green-700" />
          <span className="text-xs text-gray-400">
            Powered by InsightX AI Engine
          </span>
        </div>
      </div>
    </div>
  );
}
