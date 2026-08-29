import { ChevronDown, } from "lucide-react";

export function PoolsTransactions () {
  return (
    <div className="flex flex-row justify-center items-center w-full h-[56px] bg-card border-[1px] rounded-[15px] border-border shadow-soft">
      {/* Left */}
      <a href="#" className="flex flex-row justify-center items-center gap-1.5 w-[50%] h-full border-r-[1px] border-border-soft">
        <div className="text-[13px] font-medium">Pools (1)</div>
        <ChevronDown size={14} strokeWidth={2.5} />
      </a>

      {/* Right */}
      <a href="#" className="flex flex-row justify-center items-center gap-1.5 w-[50%] h-full ">
        <div className="text-[13px] font-medium">Transactions (2)</div>
        <ChevronDown size={14} strokeWidth={2.5} />
      </a>
    </div>
  )
}