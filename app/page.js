"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      router.replace(data.session ? "/dashboard" : "/login");
    })();
  }, [router]);

  return (
    <div className="screen center">
      <Loader2 className="spin" size={24} color="#2563EB" />
    </div>
  );
}
