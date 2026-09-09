import { BadgeCheck, ChevronDown, Ellipsis, Wallet } from "lucide-react";

import { notFound } from 'next/navigation'

import { Main } from "@/components/tokens/Main";

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
        <div className="flex flex-row justify-center items-center h-[46px] border-y-[1px] border-b-border/25 border-t-transparent">
          <a href="#" className="flex flex-col justify-center items-center text-fg w-[100px] h-full border-y-[2px] border-b-fg border-t-transparent">
            For humans
          </a>

          <a href="#" className="flex flex-col justify-center items-center text-fg w-[100px] h-full border-y-[2px] border-transparent">
            For agents
          </a>
        </div>

        {/* Sort */}
        <div className="flex flex-row justify-end items-center w-full gap-1 px-2">
          All chains
          <ChevronDown size={14} strokeWidth={2.5} />
        </div>

        {/* Card */}
        <div className="flex flex-col justify-start items-center gap-3 w-full">
          <div className="flex flex-col justify-start items-center w-full bg-card border-[1px] rounded-[15px] border-border shadow-soft">
            {/* Top */}
            <div className="flex flex-col justify-start items-center w-full px-[15px] border-b-[1px] border-border-soft">
              {/* Head */}
              <div className="flex flex-row justify-start items-start w-full pt-[15px] pb-[10px] border-b-[1px] border-dashed border-border-soft">
                {/* Left */}
                <div className="flex flex-col justify-start items-start gap-0.5 w-[70%]">
                  <div className="font-medium">Entered 2 hours ago</div>
                  <div className="text-[12px] text-fg-muted">For 10 mins</div>
                </div>
                {/* Right */}
                <div className="flex flex-row justify-end items-center gap-1 w-[30%]">
                  <a href="#" className="flex flex-row justify-center items-center text-[12px] w-[80px] h-[30px] rounded-[8px] bg-button-secondary">
                    Button
                  </a>

                  <a href="#">
                    <Ellipsis size={14} strokeWidth={2.5} />
                  </a>
                </div>
              </div>

              {/* Menu */}
              <div className="flex flex-row justify-center items-center h-[46px]">
                <a href="#" className="flex flex-col justify-center items-center text-fg w-[100px] h-full border-y-[2px] border-b-fg border-t-transparent">
                  The data
                </a>

                <a href="#" className="flex flex-col justify-center items-center text-fg w-[100px] h-full border-y-[2px] border-transparent">
                  Logs (4)
                </a>
              </div>
            </div>

            {/* Center */}
            <ul className="flex flex-col justify-start items-center w-full px-[15px]">
              <li className="flex flex-row justify-start items-center w-full min-h-[46px] border-b-[1px] border-dashed border-border-soft">
                {/* Left */}
                <div className="flex flex-row justify-start items-center w-[50%]">
                  Exit amount
                </div>

                {/* Right */}
                <div className="flex flex-row justify-end items-center w-[50%]">
                  USD $21.54 <span className="font-semibold">(x4.14)</span>
                </div>
              </li>

              <li className="flex flex-row justify-start items-center w-full min-h-[46px]">
                {/* Left */}
                <div className="flex flex-row justify-start items-center w-[50%]">
                  Initial investment
                </div>

                {/* Right */}
                <div className="flex flex-row justify-end items-center w-[50%]">
                  USD $5.00
                </div>
              </li>
            </ul>

            {/* Bottom */}
            <a href="#" className="flex flex-col justify-center items-center text-fg w-full h-[36px] rounded-b-[15px] bg-bg">
              <ChevronDown size={14} strokeWidth={2.5} />
            </a>
          </div>

          <div className="text-[12px] text-fg-muted text-right w-full pr-[10px]">
            Profit is realized.
          </div>
        </div>
      </div>
    </div>
  )
}