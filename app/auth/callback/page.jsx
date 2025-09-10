"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/auth"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handle = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error("Error fetching session:", error.message)
        router.push("/login")
      } else if (data?.session) {
        router.push("/dashboard")  // 👈 redirect after success
      } else {
        router.push("/login")
      }
    }
    handle()
  }, [router])

  return <p>Completing sign-in...</p>
}
