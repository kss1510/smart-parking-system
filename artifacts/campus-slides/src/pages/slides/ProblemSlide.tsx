export default function ProblemSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A1A12]">
      <div className="absolute top-0 right-0 w-[45vw] h-full bg-gradient-to-l from-[#004D36]/15 to-transparent" />
      <div className="absolute bottom-0 left-0 w-[60vw] h-[2px] bg-gradient-to-r from-[#C9A02A]/60 to-transparent" />

      <div className="relative flex h-full flex-col px-[8vw] py-[7vh]">
        <div className="mb-[5vh]">
          <p className="font-body text-[1.4vw] font-medium tracking-[0.2em] text-[#C9A02A] uppercase">
            Problem Identification
          </p>
          <h2 className="mt-[1.5vh] font-display text-[5vw] font-black leading-tight tracking-tight text-[#F0F5F2]">
            Campus Parking
            <span className="block text-[#C9A02A]">Is Fundamentally Broken</span>
          </h2>
          <p className="mt-[1.5vh] font-body text-[1.7vw] text-[#8BAA9E] max-w-[52vw]">
            Every morning, GITAM University's parking turns into a chaotic scramble — 
            with no system, no visibility, and no accountability.
          </p>
        </div>

        <div className="flex gap-[2.5vw] flex-1 items-stretch">
          <div className="flex-1 border border-[#004D36] bg-[#004D36]/10 rounded-sm px-[2.5vw] py-[3vh] flex flex-col justify-between">
            <div className="text-[3.5vw] font-display font-black text-[#C9A02A]">01</div>
            <div>
              <h3 className="font-display text-[2vw] font-bold text-[#F0F5F2] mb-[1.5vh]">
                Zero Real-Time Visibility
              </h3>
              <p className="font-body text-[1.6vw] text-[#8BAA9E] leading-relaxed">
                Students and faculty drive blind — circling lots for 10+ minutes with no 
                way to know which slots are free until they physically see them.
              </p>
            </div>
            <div className="h-[2px] w-[3vw] bg-[#C9A02A]/40" />
          </div>

          <div className="flex-1 border border-[#004D36] bg-[#004D36]/10 rounded-sm px-[2.5vw] py-[3vh] flex flex-col justify-between">
            <div className="text-[3.5vw] font-display font-black text-[#C9A02A]">02</div>
            <div>
              <h3 className="font-display text-[2vw] font-bold text-[#F0F5F2] mb-[1.5vh]">
                No Accountability
              </h3>
              <p className="font-body text-[1.6vw] text-[#8BAA9E] leading-relaxed">
                Faculty-reserved slots get occupied by others. Overstays go undetected. 
                Violations have no consequence — the system rewards bad behavior.
              </p>
            </div>
            <div className="h-[2px] w-[3vw] bg-[#C9A02A]/40" />
          </div>

          <div className="flex-1 border border-[#C9A02A]/30 bg-[#C9A02A]/5 rounded-sm px-[2.5vw] py-[3vh] flex flex-col justify-between">
            <div className="text-[3.5vw] font-display font-black text-[#C9A02A]">03</div>
            <div>
              <h3 className="font-display text-[2vw] font-bold text-[#F0F5F2] mb-[1.5vh]">
                Unfair Access, Every Day
              </h3>
              <p className="font-body text-[1.6vw] text-[#8BAA9E] leading-relaxed">
                No queue, no waiting system, no priority logic. Whoever arrives first 
                wins — regardless of need, distance, or compliance history.
              </p>
            </div>
            <div className="h-[2px] w-[3vw] bg-[#C9A02A]" />
          </div>
        </div>
      </div>
    </div>
  );
}
