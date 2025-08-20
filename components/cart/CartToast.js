"use client";
import { useCart } from "@/contexts/CartContext";
import Toast from "../Toast";

export default function CartToast() {
  const { cartMessage, clearCartMessage } = useCart();

  if (!cartMessage) return null;

  return (
    <Toast
      message={cartMessage.message}
      type={cartMessage.type}
      onClose={clearCartMessage}
      duration={5000}
    />
  );
}
