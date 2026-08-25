export function Stats () {
  return (
    <div className="flex flex-col justify-start items-center gap-3 w-full">
      <div className="flex flex-row justify-center items-center w-full h-[56px] bg-card border-[1px] rounded-[15px] border-border shadow-soft">
        {/* Left */}
        <div className="flex flex-col justify-center items-center w-[33%] h-full">
          <div className="text-[12px] text-fg-muted">Profit</div>
          <div className="text-[15px] font-medium">+204.04%</div>
        </div>

        {/* Center */}
        <div className="flex flex-col justify-center items-center w-[33%] h-full border-l-[1px] border-r-[1px] border-border-soft">
          <div className="text-[12px] text-fg-muted">Buys</div>
          <div className="text-[15px] font-medium">42,823</div>
        </div>

        {/* Right */}
        <div className="flex flex-col justify-center items-center w-[33%] h-full">
          <div className="text-[12px] text-fg-muted">Sells</div>
          <div className="text-[15px] font-medium">39,002</div>
        </div>
      </div>

      <div className="text-[12px] text-fg-muted">
        Token is still being traded.
      </div>
    </div>
  )
}