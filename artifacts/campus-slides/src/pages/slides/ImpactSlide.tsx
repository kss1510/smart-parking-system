export default function ImpactSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A1A12]">
      <div className="absolute top-0 left-0 right-0 h-[0.6vh] bg-[#C9A02A]" />
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_50%_80%,rgba(0,77,54,0.2),transparent_55%)]" />

      <div className="relative flex h-full flex-col px-[8vw] py-[7vh]">
        <div className="mb-[4vh]">
          <p className="font-body text-[1.4vw] font-medium tracking-[0.2em] text-[#C9A02A] uppercase">
            Before vs After
          </p>
          <h2 className="mt-[1vh] font-display text-[4.5vw] font-black leading-tight tracking-tight text-[#F0F5F2]">
            Measurable Impact
          </h2>
        </div>

        <div className="flex gap-[2.5vw] flex-1 max-h-[60vh]">
          <div className="flex-1 flex flex-col">
            <div className="mb-[2vh] flex items-center gap-[1.5vw]">
              <div className="h-[3px] w-[3vw] bg-red-500/60" />
              <p className="font-display text-[2vw] font-bold text-red-400">Without CampusPark</p>
            </div>
            <div className="flex-1 border border-red-500/20 bg-red-500/5 rounded-sm px-[2.5vw] py-[3vh] flex flex-col justify-around">
              <div className="border-l-2 border-red-500/40 pl-[2vw]">
                <p className="font-display text-[1.7vw] font-semibold text-[#F0F5F2]">10+ minutes</p>
                <p className="font-body text-[1.5vw] text-[#8BAA9E]">wasted each morning searching blindly for a slot</p>
              </div>
              <div className="border-l-2 border-red-500/40 pl-[2vw]">
                <p className="font-display text-[1.7vw] font-semibold text-[#F0F5F2]">Zero enforcement</p>
                <p className="font-body text-[1.5vw] text-[#8BAA9E]">overstays and slot abuse go completely unpunished</p>
              </div>
              <div className="border-l-2 border-red-500/40 pl-[2vw]">
                <p className="font-display text-[1.7vw] font-semibold text-[#F0F5F2]">No data, no history</p>
                <p className="font-body text-[1.5vw] text-[#8BAA9E]">admin has no visibility into parking patterns or peak usage</p>
              </div>
              <div className="border-l-2 border-red-500/40 pl-[2vw]">
                <p className="font-display text-[1.7vw] font-semibold text-[#F0F5F2]">Pure luck-of-arrival</p>
                <p className="font-body text-[1.5vw] text-[#8BAA9E]">no fairness, no priority — whoever shows up first wins</p>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="font-display text-[3vw] font-black text-[#C9A02A]">→</div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="mb-[2vh] flex items-center gap-[1.5vw]">
              <div className="h-[3px] w-[3vw] bg-[#C9A02A]" />
              <p className="font-display text-[2vw] font-bold text-[#C9A02A]">With CampusPark</p>
            </div>
            <div className="flex-1 border border-[#C9A02A]/30 bg-[#C9A02A]/5 rounded-sm px-[2.5vw] py-[3vh] flex flex-col justify-around">
              <div className="border-l-2 border-[#C9A02A] pl-[2vw]">
                <p className="font-display text-[1.7vw] font-semibold text-[#F0F5F2]">Under 30 seconds</p>
                <p className="font-body text-[1.5vw] text-[#8BAA9E]">to reserve, navigate, and confirm a parking slot via mobile</p>
              </div>
              <div className="border-l-2 border-[#C9A02A] pl-[2vw]">
                <p className="font-display text-[1.7vw] font-semibold text-[#F0F5F2]">Automated penalties</p>
                <p className="font-body text-[1.5vw] text-[#8BAA9E]">overstay detected and scored at the 10-minute mark — no manual intervention</p>
              </div>
              <div className="border-l-2 border-[#C9A02A] pl-[2vw]">
                <p className="font-display text-[1.7vw] font-semibold text-[#F0F5F2]">Full analytics dashboard</p>
                <p className="font-body text-[1.5vw] text-[#8BAA9E]">real-time occupancy, zone trends, and user history — always visible to admin</p>
              </div>
              <div className="border-l-2 border-[#C9A02A] pl-[2vw]">
                <p className="font-display text-[1.7vw] font-semibold text-[#F0F5F2]">Score-based priority queue</p>
                <p className="font-body text-[1.5vw] text-[#8BAA9E]">behavioral fairness — responsible users earn faster access, every time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
