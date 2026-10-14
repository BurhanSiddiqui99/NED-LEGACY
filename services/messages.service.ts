import { sendMessage, subscribeToMessages } from "@/lib/firebase/firestore";
import { Message } from "@/types";

export const messagesService = {
  async send(orderId: string, senderId: string, receiverId: string, text: string, senderName?: string) {
    return sendMessage(orderId, senderId, receiverId, text, senderName);
  },

  subscribe(orderId: string, callback: (messages: Message[]) => void) {
    return subscribeToMessages(orderId, callback);
  },
};
