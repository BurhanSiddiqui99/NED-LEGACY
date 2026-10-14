import { sendMessage, subscribeToMessages } from "@/lib/firebase/firestore";
import { Message } from "@/types";

export const messagesService = {
  async send(
    orderId: string,
    senderId: string,
    receiverId: string,
    text: string,
    senderName?: string,
    senderRole?: "customer" | "rider" | "admin"
  ) {
    return sendMessage(orderId, senderId, receiverId, text, senderName, senderRole);
  },

  subscribe(orderId: string, callback: (messages: Message[]) => void, onError?: (err: Error) => void) {
    return subscribeToMessages(orderId, callback, onError);
  },
};
