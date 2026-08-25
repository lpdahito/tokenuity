import { BadgeCheck, BadgeX, LoaderCircle } from "lucide-react";

type Holding = {
  id: number;
  name: string;
  symbol: string;
  status: string;
  entered: string;
}

type HoldingProps = {
  holding: Holding;
};

export function HoldingItem(props: HoldingProps) {
  return (
    <li className="w-full">
      <a href="#" className="flex flex-row justify-start items-center w-full py-[20px] bg-card border-[1px] rounded-[15px] border-border shadow-soft">
        {/* Left */}
        <div className="flex flex-row justify-center items-center w-[15%] h-full">
          { props.holding.status === 'invested' ? (
            <LoaderCircle size={17} strokeWidth={2} className="animate-spin [animation-duration:2s]" />
          ) : props.holding.status === 'exited' ? (
            <BadgeCheck size={17} strokeWidth={2} />
          ) : props.holding.status === 'rugged' ? (
            <BadgeX size={17} strokeWidth={2} />
          ) : null }
        </div>

        {/* Center */}
        <div className="w-[60%] h-full">
          <h4 className="text-[15px] font-semibold">
            { props.holding.name } ({ props.holding.symbol })
          </h4>
          
          { props.holding.status === 'invested' ? (
            <div className="text-[13px]">
              <span className="font-bold">$2.53</span> (+120.44%)
            </div>
          ) : props.holding.status === 'exited' ? (
            <div className="text-[13px]">
              Sold at a profit: <span className="font-bold">2.55x</span>
            </div>
          ) : props.holding.status === 'rugged' ? (
            <div className="text-[13px]">Rug pulled</div>
          ) : null }
        </div>

        {/* Right */}
        <div className="flex flex-row justify-center items-start w-[25%] h-full">
          <span className="text-[11px] px-2 py-1 bg-button-secondary rounded-lg">
            { props.holding.entered }
          </span>
        </div>
      </a>
    </li>
  )
}