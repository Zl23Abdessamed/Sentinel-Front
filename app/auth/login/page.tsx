"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sentinel, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await sentinel.auth.login(email, password);
      // Get user context to route them correctly
      const me = await sentinel.auth.me();
      
      if (me.role === "ADMIN") {
        router.push("/admin/users"); // Route them to user management or admin dashboard
      } else {
        router.push("/dashboard"); 
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f18] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#0a0f18]/80 backdrop-blur-md border border-gray-800 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
             <Shield className="h-6 w-6 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Sentinel Access</h1>
          <p className="text-sm text-gray-400 mt-2 text-center">
            Log in to access your enterprise reporting dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email Address</label>
            <input 
              required
              name="email"
              type="email"
              placeholder="user@enterprise.dz"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Password</label>
            <input 
              required
              name="password"
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
            Authenticate
          </Button>

          <p className="text-sm text-center text-gray-500 mt-6">
            New enterprise? {" "}
            <Link href="/auth/signup" className="text-blue-500 hover:text-blue-400 font-medium">
              Register Organization
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
