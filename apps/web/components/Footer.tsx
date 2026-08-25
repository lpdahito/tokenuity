import Image from "next/image";

export function Footer() {
  return (
    <footer className="flex flex-col items-center gap-[10px] pt-[100px] pb-12 text-[12px] text-fg">
      <Image
        src="/avatar.jpg"
        alt="@lp_tokenuity avatar"
        width={40}
        height={40}
        className="rounded-full object-cover"
      />
      <div className="text-center leading-[1.8]">
        <p>
          Made with love by{" "}
          <span className="font-medium italic">@tokenuity</span>
        </p>
        <p>2026 © All rights reserved.</p>
      </div>
    </footer>
  )
}
