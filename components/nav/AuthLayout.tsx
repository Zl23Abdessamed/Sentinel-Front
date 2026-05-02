"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sentinel, User } from "@/lib/api";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { Loader2 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>({
    id : "usr_12345",
    created_at : new Date().toString(),
    email : "admin@sentinel.dz",
    role : "ADMIN",
    department_id: "dept_123",
    institution_id : "inst_123",
    name : "Rachid Mansouri",
  });
  const [loading, setLoading] = useState(false); // Set to false to bypass loading for fake auth

//   useEffect(() => {
//     sentinel.auth.me()
//       .then((data) => {
//         setUser(data);
//       })
//       .catch(() => {
//         router.push("/auth/login");
//       })
//       .finally(() => {
//         setLoading(false);
//       });
//   }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f18] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  // SidebarNav expects { name: string, role: string }
  // user object has: { id, email, role, name, ... } 
  // Let's pass the user securely. Wait, what properties does user have?

  return (
    <div className="flex min-h-screen relative z-10 bg-[#0a0f18]">
      <SidebarNav user={{ name: user.name || user.email, role: user.role }} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
