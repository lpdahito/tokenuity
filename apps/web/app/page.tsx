import { BadgeCheck, ChevronDown, Ellipsis, ListSortAscending, Wallet } from "lucide-react";

import { notFound } from 'next/navigation'

import { Feed } from "@/components/home/Feed";

export default async function Home() {

  return (
    <div className="flex flex-col items-center justify-start w-full">
      <div className="flex flex-col justify-between items-center w-full max-w-[492px] pt-[100px] gap-[10px]">
        <div className="flex flex-col justify-center items-center gap-2 text-[13px]">
          <BadgeCheck size={15} strokeWidth={2.5} />
          <span>Best tool for trading</span>
        </div>

        <h1 className="font-display font-bold text-[32px] text-center leading-[1.20]">
          Simple, Token Analysis<br />
          That Doesn’t Suck.
        </h1>

        <div className="flex flex-row justify-center items-center text-fg-muted text-[14px] text-center leading-loose mb-[10px]">
          <p>
            Good typography establishes a visual hierarchy that guides the reader.<br />
            The right pairing creates harmony between headings and body.
          </p>
        </div>

        <div className="flex flex-col justify-center items-center gap-1.5">
          <a href="#" className="flex flex-row items-center justify-center bg-button text-[13px] text-button-fg w-[150px] h-[44px] gap-[6px] rounded-full">
            <Wallet size={12} strokeWidth={2.5} />
            <span>Get started</span>
          </a>

          <div className="text-[11px] text-fg-muted">
            It only takes 30 seconds
          </div>
        </div>
        <div className="text-[28px] my-[-10px]">~</div>
      </div>

      <div className="flex flex-col justify-start items-center gap-2 w-full max-w-[500px]">
        {/* Menu */}
        <div className="flex flex-row justify-center items-center h-[46px] mb-[20px] border-y-[1px] border-b-border/25 border-t-transparent">
          <a href="#" className="flex flex-col justify-center items-center text-fg w-[100px] h-full border-y-[2px] border-b-fg border-t-transparent">
            For humans
          </a>

          <a href="#" className="flex flex-col justify-center items-center text-fg w-[100px] h-full border-y-[2px] border-transparent">
            For agents
          </a>
        </div>

        {/* Sort */}
        {/* <div className="flex flex-row justify-end items-center w-full gap-1 px-2">
          All chains
          <ChevronDown size={14} strokeWidth={2.5} />
        </div> */}

        {/* Card */}
        <div className="flex flex-col justify-start items-center gap-2 w-full">
          <div className="flex flex-col justify-start items-center w-full bg-card border-[1px] rounded-[15px] border-border shadow-soft">
            {/* Top */}
            <div className="flex flex-col justify-start items-center w-full px-[15px] border-b-[1px] border-border-soft">
              {/* Head */}
              <div className="flex flex-row justify-start items-center w-full pt-[15px] pb-[10px] ">
                {/* Left */}
                <div className="flex flex-col justify-center items-start gap-0.5 w-[30%] h-full">
                  <div className="font-medium">Top tokens</div>
                  {/* <div className="text-[12px] text-fg-muted">422 added (last 30m)</div> */}
                </div>

                {/* Right */}
                <div className="flex flex-row justify-end items-center gap-1 w-[70%]">
                  <a href="#" className="flex flex-row justify-start items-center text-[12px] w-[100px] h-[30px] px-[12px] rounded-[8px] bg-button-secondary">
                    <div className="flex flex-row justify-start items-center gap-[5] w-[75%]">
                      All chains
                    </div>

                    <div className="flex flex-row justify-end w-[25%]">
                      <ChevronDown size={13} strokeWidth={2.5} />
                    </div>
                  </a>

                  <a href="#" className="flex flex-row justify-start items-center text-[12px] w-[120px] h-[30px] px-[12px] rounded-[8px] bg-button-secondary">
                    <div className="flex flex-row justify-start items-center gap-[5] w-[75%]">
                      <ListSortAscending size={12} strokeWidth={3} />
                      Ranked
                    </div>

                    <div className="flex flex-row justify-end w-[25%]">
                      <ChevronDown size={13} strokeWidth={2.5} />
                    </div>
                  </a>
                </div>
              </div>

            </div>

            {/* Middle */}
            <ul className="flex flex-col justify-start items-center w-full px-[15px]">
              <li className="flex flex-row justify-start items-center w-full min-h-[42px] border-b-[1px] border-dashed border-border-soft">
                {/* Left */}
                <div className="w-[5%]">1.</div>

                {/* Center */}
                <div className="flex flex-row justify-start items-center gap-1 text-[12px] w-[80%]">
                  <span className="text-[13px] font-semibold">Hyperliquid (HYPE)</span>
                  <span className="text-fg-muted">$0.0021</span>
                  <span className="text-lime-600">(+23.21%)</span>
                </div>

                {/* Right */}
                <div className="flex flex-row justify-end items-center gap-2 text-[12px] w-[15%]">
                  <span className="text-fg-muted">5s old</span>
                  <a href="#" className="">
                    <Ellipsis size={16} strokeWidth={2.5} />
                  </a>
                </div>
              </li>

              <li className="flex flex-row justify-start items-center w-full min-h-[42px] border-b-[1px] border-dashed border-border-soft">
                {/* Left */}
                <div className="w-[5%]">2.</div>

                {/* Center */}
                <div className="flex flex-row justify-start items-center gap-1 text-[12px] w-[80%]">
                  <span className="text-[13px] font-semibold">Uniswap (UNI)</span>
                  <span className="text-fg-muted">$6.42</span>
                  <span className="text-lime-600">(+0.77%)</span>
                </div>

                {/* Right */}
                <div className="flex flex-row justify-end items-center gap-2 text-[12px] w-[15%]">
                  <span className="text-fg-muted">2h old</span>
                  <a href="#" className="">
                    <Ellipsis size={16} strokeWidth={2.5} />
                  </a>
                </div>
              </li>

              <li className="flex flex-row justify-start items-center w-full min-h-[42px]">
                {/* Left */}
                <div className="w-[5%]">3.</div>

                {/* Center */}
                <div className="flex flex-row justify-start items-center gap-1 text-[12px] w-[80%]">
                  <span className="text-[13px] font-semibold">DevBot (DEVB)</span>
                  <span className="text-fg-muted">$0.0021</span>
                  <span className="text-rose-700">(-3.21%)</span>
                </div>

                {/* Right */}
                <div className="flex flex-row justify-end items-center gap-2 text-[12px] w-[15%]">
                  <span className="text-fg-muted">24m old</span>
                  <a href="#" className="">
                    <Ellipsis size={16} strokeWidth={2.5} />
                  </a>
                </div>
              </li>
            </ul>

            {/* Bottom */}
            <a href="#" className="flex flex-col justify-center items-center text-fg w-full h-[32px] rounded-b-[15px] bg-bg">
              <ChevronDown size={14} strokeWidth={2.5} />
            </a>
          </div>

          <div className="text-[12px] text-fg-muted text-center w-full px-[8px]">3 of 122,004 tokens</div>
        </div>

        {/* Ellipsis */}
        <div className="flex flex-row justify-center items-center gap-[2px] w-full mb-[20px]">
          <div className="w-[5px] h-[5px] bg-fg rounded-full"></div>
          <div className="w-[5px] h-[5px] bg-border rounded-full"></div>
          <div className="w-[5px] h-[5px] bg-border rounded-full"></div>
        </div>

        {/* Feed */}
        <Feed />
      </div>
    </div>
  )
}