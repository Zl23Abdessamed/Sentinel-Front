"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sentinel, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const institution = formData.get("institution") as string;

    try {
      await sentinel.auth.signupAdmin(email, password, name, institution);
      await sentinel.auth.login(email, password); // auto login on success
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f18] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#0a0f18]/80 backdrop-blur-md border border-gray-800 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
             <ShieldAlert className="h-6 w-6 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Sentinel Admin</h1>
          <p className="text-sm text-gray-400 mt-2 text-center">
            Register your enterprise to establish a secure reporting ecosystem.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Full Name</label>
            <input 
              required
              name="name"
              type="text"
              placeholder="Admin Name"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Enterprise Name</label>
            <input 
              required
              name="institution"
              type="text"
              placeholder="e.g. Sonatrach, CNEP..."
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Work Email</label>
            <input 
              required
              name="email"
              type="email"
              placeholder="admin@enterprise.dz"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Password</label>
            <input 
              required
              name="password"
              type="password"
              placeholder="••••••••"
              minLength={8}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
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
            className="w-full bg-orange-600 hover:bg-orange-700 text-white mt-4"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
            Create Organization
          </Button>

          <p className="text-sm text-center text-gray-500 mt-6">
            Already registered? {" "}
            <Link href="/auth/login" className="text-orange-500 hover:text-orange-400 font-medium">
              Sign In
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
