"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { removeToken, removeUser } from "../lib/auth";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    removeToken();
    removeUser();
    router.replace("/login");
  }, [router]);

  return null;
}
