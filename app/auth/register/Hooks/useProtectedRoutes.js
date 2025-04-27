"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSession from "../useSession";

const useProtectedRoute = () => {
  const router = useRouter();
  const session = useSession(); // Custom hook to check session

  useEffect(() => {
    if (session === null) {
      // Session is being fetched, do nothing
      return;
    }

    if (!session) {
      // No session found, redirect to login
      router.push("/login");
    }
  }, [session, router]);

  return session; // Return the session for use in the component
};

export default useProtectedRoute;