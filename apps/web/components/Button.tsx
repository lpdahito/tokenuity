import { Copy } from "lucide-react";

export function Button() {
  return (
    <a href="#" className="flex flex-row items-center justify-center bg-button text-[13px] text-button-fg w-[150px] h-[44px] gap-[6px] rounded-full">
      <Copy size={12} strokeWidth={2.5} />
      <span>Copy my trades</span>
    </a>
  )
}