import { House, TextAlignEnd } from "lucide-react";

export function Navbar() {
  return (
    <div className="flex flex-row w-full max-w-[800px] h-[150px] justify-end items-center shrink-0">
      {/* <ol className="flex flex-row w-[50%] h-full justify-start items-center text-[12px]">
        <li>
          <a href="#">
            <House size={15} strokeWidth={2.5} />
          </a>
        </li>
        <span className="mx-1.5">{'>'}</span>
        <li>
          <a href="#">
            My Portfolio
          </a>
        </li>
      </ol> */}

      <div className="flex flex-row w-[50%] justify-end">
        <a href="#">
          <TextAlignEnd size={18} strokeWidth={3} />
        </a>
      </div>
    </div>
  )
}