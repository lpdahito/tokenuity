import { CircleDashed, CircleDot, CornerDownRight, } from "lucide-react";



export function Feed () {
  return (
    <div className="flex flex-col justify-start items-start text-fg w-[500px] px-[10px]">
      {/* Title */}
      <div className="flex flex-row justify-start items-center gap-1 pb-[8px]">
        <CircleDot color ={'green'} size={11} strokeWidth={4} />
        <h4 className="font-medium">Live feed</h4>
        <span className="text-[12px] text-fg-muted">(updated 10s ago)</span>
      </div>

      {/* List */}
      <ul className="flex flex-col justify-start items-start gap-0 w-full px-[10px] mb-[20px]">
        <li className="flex flex-col justify-start items-center w-full border-b-1 border-border-soft border-dashed">
          {/* main info */}
          <div className="flex flex-row justify-start items-center w-full h-[30px]">
            {/* left */}
            <div className="flex flex-row justify-start items-center gap-1 w-[75%]">
              <span className="font-medium">Base</span>
              <span>-</span>
              Scanned newly created pairs
            </div>

            {/* right */}
            <div className="text-[12px] text-right text-fg-muted w-[25%]">
              Scan time: 8ms
            </div>
          </div>

          {/* other stats */}
          <ul className="flex flex-col justify-start items-center text-[12px] w-full px-[10px]">
            {/* item 1 */}
            <li className="flex flex-row justify-start items-center gap-2 w-full h-[30px]">
              <CornerDownRight className="text-fg-muted" size={13} strokeWidth={3} />
              Added +3 new tokens
            </li>

            {/* item 2 */}
            <li className="flex flex-row justify-start items-center gap-2 w-full h-[30px]">
              <CornerDownRight className="text-fg-muted" size={13} strokeWidth={3} />
              Added +3 new tokens
            </li>
          </ul>
        </li>

        <li className="flex flex-col justify-start items-center w-full border-b-1 border-border-soft border-dashed">
          {/* main info */}
          <div className="flex flex-row justify-start items-center w-full h-[30px]">
            {/* left */}
            <div className="flex flex-row justify-start items-center gap-1 w-[75%]">
              <span className="font-medium">Base</span>
              <span>-</span>
              Scanned newly created pairs
            </div>

            {/* right */}
            <div className="text-[12px] text-right text-fg-muted w-[25%]">
              Scan time: 8ms
            </div>
          </div>

          {/* other stats */}
          <ul className="flex flex-col justify-start items-center text-[12px] w-full px-[10px]">
            {/* item 1 */}
            <li className="flex flex-row justify-start items-center gap-2 w-full h-[30px]">
              <CornerDownRight className="text-fg-muted" size={13} strokeWidth={3} />
              Added +3 new tokens
            </li>
          </ul>
        </li>

        <li className="flex flex-col justify-start items-center w-full border-b-1 border-border-soft border-dashed">
          {/* main info */}
          <div className="flex flex-row justify-start items-center w-full h-[30px]">
            {/* left */}
            <div className="flex flex-row justify-start items-center gap-1 w-[75%]">
              <span className="font-medium">Bsc</span>
              <span>-</span>
              Scanned 22,098 swaps
            </div>

            {/* right */}
            <div className="text-[12px] text-right text-fg-muted w-[25%]">
              Scan time: 0.12s
            </div>
          </div>
        </li>

        <li className="flex flex-col justify-start items-center w-full border-b-1 border-border-soft border-dashed">
          {/* main info */}
          <div className="flex flex-row justify-start items-center w-full h-[30px]">
            {/* left */}
            <div className="flex flex-row justify-start items-center gap-1 w-[75%]">
              <span className="font-medium">Base</span>
              <span>-</span>
              Scanned newly created pairs
            </div>

            {/* right */}
            <div className="text-[12px] text-right text-fg-muted w-[25%]">
              Scan time: 8ms
            </div>
          </div>

          {/* other stats */}
          <ul className="flex flex-col justify-start items-center text-[12px] w-full px-[10px]">
            {/* item 1 */}
            <li className="flex flex-row justify-start items-center gap-2 w-full h-[30px]">
              <CornerDownRight className="text-fg-muted" size={13} strokeWidth={3} />
              Added +3 new tokens
            </li>

            {/* item 2 */}
            <li className="flex flex-row justify-start items-center gap-2 w-full h-[30px]">
              <CornerDownRight className="text-fg-muted" size={13} strokeWidth={3} />
              Added +3 new tokens
            </li>
          </ul>
        </li>
      </ul>

      {/* Scanning */}
      <div className="flex flex-row justify-center items-center gap-1 text-[12px] text-fg-muted w-full">
        <CircleDashed size={11} strokeWidth={3} />
        Scanning...
      </div>
    </div>
  )
}