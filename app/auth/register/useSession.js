"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient"; // Adjust the import path as necessary
// This hook manages the session state and listens for authentication state changes

const useSession = () => {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Fetch the initial session
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Initial session:", session); // Debugging
      setSession(session);
    };

    fetchSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed. Session:", session); // Debugging
      setSession(session);
    });

    // Cleanup: Unsubscribe when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return session;
};

export default useSession;