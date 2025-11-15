import React, { useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export default function RequireAdmin({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) return <p>Loading...</p>;
  if (!isSignedIn) return <Navigate to="/access-denied" replace />;

  const isAdmin = useMemo(() => {
    const rolesArray = [
      ...(user?.publicMetadata?.roles || []),
      ...(user?.privateMetadata?.roles || []),
      ...(user?.unsafeMetadata?.roles || []),
    ].map((r) => r.toLowerCase());

    const singleRole = (
      user?.publicMetadata?.role ||
      user?.privateMetadata?.role ||
      user?.unsafeMetadata?.role ||
      ""
    ).toLowerCase();

    return rolesArray.includes("admin") || singleRole === "admin";
  }, [user]);

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
