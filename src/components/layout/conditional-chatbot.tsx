"use client";

import { usePathname } from "next/navigation";
import { Chatbot } from "./chatbot";

export function ConditionalChatbot() {
  const pathname = usePathname();

  // Don't show chatbot on the chat page (since Lumi AI is already available as a contact)
  if (pathname === "/dashboard/chat") {
    return null;
  }

  return <Chatbot />;
}
