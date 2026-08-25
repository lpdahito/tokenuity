import { ChevronDown, Ellipsis, } from "lucide-react";

export function Main () {
  return (
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
  )
}