import { BadgeCheck, BadgeX, ChevronUp } from "lucide-react";

import { Head } from "@/components/portfolio/Head";
import { HoldingItem } from "@/components/portfolio/Holding";

type Holding = {
  id: number;
  name: string;
  symbol: string;
  status: string;
  entered: string;
}

const holdings: Holding[] = [
  {
    id: 0,
    name: 'Tether Gold',
    symbol: 'XAUt',
    status: 'invested',
    entered: '1 min ago'
  },
  {
    id: 1,
    name: 'Hyperliquid',
    symbol: 'HYPE',
    status: 'exited',
    entered: '3 mins ago'
  },
  {
    id: 2,
    name: 'World Liberty Financial',
    symbol: 'WLFI',
    status: 'rugged',
    entered: '26 mins ago'
  }
]

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-start">
      <Head />

      <ol className="flex flex-row items-center justify-start w-[300px] h-[60px] border-b-[1px] border-[#d2d2d2]">
        <li className="text-[14px] w-[50%] h-full">
          <a className="flex flex-row items-center justify-center w-full h-full border-b-[2px] border-fg" href="#">
            Base
          </a>
        </li>

        <li className="text-[14px] w-[50%] h-full">
          <a className="flex flex-row items-center justify-center w-full h-full" href="#">
            BSC
          </a>
        </li>
      </ol>

      <div className="flex flex-row justify-center py-[30px]">
        <svg width="275" height="49" viewBox="0 0 275 49" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.30933 48.2531C7.80617 36.6305 13.9571 33.235 29.8093 33.2532C42.6685 33.2679 43.9792 18.6709 60.3093 14.2532C75.6569 10.1012 77.7638 25.9384 90.8093 23.2532C100.147 21.331 106.726 24.1898 120.809 19.7532C145.679 11.9187 139.81 47.3766 150.809 43.7531C168.637 37.8803 168.323 20.5839 181.309 9.25315C188.274 3.17618 196.524 32.7694 211.809 19.7532C222.44 10.7009 228.15 -0.314639 242.809 1.75315C255.132 3.49141 261.923 6.15173 273.809 14.2532" stroke="#44403B" stroke-width="3"/>
        </svg>
      </div>

      <div className="font-display text-[22px]">
        <div className="flex flex-row items-center justify-center font-bold gap-[4px]">
          0.1109 ETH 
          <span className="text-[15px]">
            (USD $398.79)
          </span>
        </div>

        <div className="flex flex-row items-center justify-center font-semibold gap-[4px]">
          <ChevronUp size={18} strokeWidth={3} />
          11.94%
        </div>
      </div>

      <div className="text-[12px] text-right w-[450px] py-[10px]">
        Bought 3/22 in last 30 mins
      </div>

      <ol className="flex flex-col justify-start items-center gap-3 w-[450px]">
        {holdings.map((holding) => (
          <HoldingItem key={holding.id} holding={holding} />
        ))}
      </ol>

      <div className="py-[20px]">
        <a href="#" className="flex flex-row items-center justify-center bg-[#F7F7F7] text-[13px] w-[120px] h-[44px] rounded-full">
          Load more
        </a>
      </div>

      <div className="text-[12px]">
        Showing: 3 of 64
      </div>
    </div>
  )
}