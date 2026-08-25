import { Link2 } from "lucide-react";

import { Button } from "@/components/Button";

export function Head () {
  return (
    <div className="flex flex-col justify-between items-center max-w-[492px] pt-[100px] gap-[10px]">
      <a href="#" className="flex flex-row justify-center items-center text-[13px]">
        <Link2 size={15} strokeWidth={2.5} className="mr-[4px]" />
        <span>tokenuity.eth</span>
      </a>

      <h1 className="font-display font-bold text-[42px]">
        My Portfolio.
      </h1>

      <p className="text-fg-muted text-[15px] text-center">
        Good typography establishes a visual hierarchy that guides the reader.
        The right pairing creates harmony between headings and body.
      </p>

      <Button />
    </div>
  )
}