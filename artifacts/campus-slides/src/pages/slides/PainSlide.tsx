export default function PainSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#061210]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_50%_60%,rgba(0,77,54,0.25),transparent_65%)]" />
      <div className="absolute top-[10vh] left-[8vw] w-[1px] h-[80vh] bg-gradient-to-b from-transparent via-[#C9A02A]/30 to-transparent" />
      <div className="absolute top-[10vh] right-[8vw] w-[1px] h-[80vh] bg-gradient-to-b from-transparent via-[#004D36]/50 to-transparent" />

      <div className="relative flex h-full flex-col items-center justify-center px-[8vw]">
        <p className="font-body text-[1.5vw] font-medium tracking-[0.2em] text-[#C9A02A] uppercase mb-[3vh]">
          The Numbers Tell the Story
        </p>

        <div className="flex items-start justify-center gap-[6vw] w-full">
          <div className="text-center flex flex-col items-center">
            <div className="font-display text-[10vw] font-black leading-none text-[#F0F5F2]">
              10<span className="text-[#C9A02A]">+</span>
            </div>
            <div className="mt-[1.5vh] font-body text-[1.7vw] text-[#8BAA9E] max-w-[18vw] text-center leading-snug">
              minutes wasted per driver searching for a slot each morning
            </div>
          </div>

          <div className="w-[1px] h-[30vh] bg-[#004D36] self-center" />

          <div className="text-center flex flex-col items-center">
            <div className="font-display text-[10vw] font-black leading-none text-[#C9A02A]">
              0
            </div>
            <div className="mt-[1.5vh] font-body text-[1.7vw] text-[#8BAA9E] max-w-[18vw] text-center leading-snug">
              enforcement mechanism for overstays or unauthorized parking
            </div>
          </div>

          <div className="w-[1px] h-[30vh] bg-[#004D36] self-center" />

          <div className="text-center flex flex-col items-center">
            <div className="font-display text-[10vw] font-black leading-none text-[#F0F5F2]">
              30<span className="text-[#C9A02A]">+</span>
            </div>
            <div className="mt-[1.5vh] font-body text-[1.7vw] text-[#8BAA9E] max-w-[18vw] text-center leading-snug">
              vehicles competing daily for limited, unmanaged parking slots
            </div>
          </div>
        </div>

        <div className="mt-[5vh] border border-[#004D36] bg-[#004D36]/15 rounded-sm px-[4vw] py-[2.5vh] max-w-[55vw] text-center">
          <p className="font-display text-[2vw] font-semibold text-[#F0F5F2] leading-snug">
            "A campus without a parking system isn't just inconvenient — 
            <span className="text-[#C9A02A]"> it's a daily failure of institutional order."</span>
          </p>
        </div>
      </div>
    </div>
  );
}
