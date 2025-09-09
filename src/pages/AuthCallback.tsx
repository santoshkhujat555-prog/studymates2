import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient"; // adjust if your client is in another folder

export default function AuthCallback() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Verifying your account...");

  useEffect(() => {
    const run = async () => {
      try {
        const href = window.location.href;
        const url = new URL(href);

        // Case 1: PKCE ?code=...
        const code = url.searchParams.get("code");
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (data?.session) {
            navigate("/Profile"); // redirect to profile/dashboard
            return;
          }
        }

        // Case 2: Magic link #access_token=...
        const hash = window.location.hash ? window.location.hash.substring(1) : "";
        if (hash) {
          const params = Object.fromEntries(new URLSearchParams(hash));
          const access_token = params.access_token;
          const refresh_token = params.refresh_token;
          if (access_token && refresh_token) {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) throw error;
            if (data?.session) {
              navigate("/Profile"); // redirect to profile/dashboard
              return;
            }
          }
        }

        // Fallback
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data?.session) {
          navigate("/Profile");
          return;
        }

        setMsg("Could not sign you in — please try logging in manually.");
        navigate("/Auth"); // back to login page
      } catch (err) {
        console.error("Auth callback error:", err);
        setMsg("Authentication failed. Redirecting to login...");
        navigate("/Auth");
      }
    };

    run();
  }, [navigate]);

  return <p>{msg}</p>;
}
