import { BadgeCheck, ChevronDown, Ellipsis, ExternalLink, Wallet } from "lucide-react";

import { Main } from "@/components/holdings/Main";
import { Stats } from "@/components/holdings/Stats";
import { PoolsTransactions } from "@/components/holdings/PoolsTransactions";

export default async function Home() {
  return (
    <div className="flex flex-col items-center justify-start w-full">
      <div className="flex flex-col justify-between items-center w-full max-w-[492px] pt-[100px] gap-[10px]">
        <div className="flex flex-col justify-center items-center gap-2 text-[13px]">
          <BadgeCheck size={15} strokeWidth={2.5} />
          <span>Sold for a profit</span>
        </div>

        <h1 className="font-display font-bold text-[32px]">
          Hyperliquid (HYPE)
        </h1>

        <div className="flex flex-row justify-center items-center gap-[2px] text-fg-muted text-[14px] text-center">
          <span>0xf199e2A67a3862A4d1178C697aBb8e76eF7C681b</span>
          <ExternalLink className="mt-[-3px]" size={13} strokeWidth={2.5} />
        </div>

        <div className="flex flex-row justify-center pb-[15px] pt-[12px]">
          <svg width="275" height="49" viewBox="0 0 275 49" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.30933 48.2531C7.80617 36.6305 13.9571 33.235 29.8093 33.2532C42.6685 33.2679 43.9792 18.6709 60.3093 14.2532C75.6569 10.1012 77.7638 25.9384 90.8093 23.2532C100.147 21.331 106.726 24.1898 120.809 19.7532C145.679 11.9187 139.81 47.3766 150.809 43.7531C168.637 37.8803 168.323 20.5839 181.309 9.25315C188.274 3.17618 196.524 32.7694 211.809 19.7532C222.44 10.7009 228.15 -0.314639 242.809 1.75315C255.132 3.49141 261.923 6.15173 273.809 14.2532" stroke="#44403B" stroke-width="3"/>
          </svg>
        </div>

        <div className="flex flex-col justify-center items-center gap-1.5 mb-[30px]">
          <a href="#" className="flex flex-row items-center justify-center bg-button text-[13px] text-button-fg w-[150px] h-[44px] gap-[6px] rounded-full">
            <Wallet size={12} strokeWidth={2.5} />
            <span>Buy token</span>
          </a>

          <div className="text-[11px] text-fg-muted">
            Base
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-start items-center gap-4 w-full max-w-[500px]">

        <Stats />

        <PoolsTransactions />
        
        <Main />
      </div>
    </div>
  )
}