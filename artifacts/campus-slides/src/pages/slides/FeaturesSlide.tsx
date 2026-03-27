export default function FeaturesSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A1A12]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_100%_0%,rgba(201,160,42,0.08),transparent_50%)]" />
      <div className="absolute top-[7vh] left-[8vw] right-[8vw] h-[2px] bg-gradient-to-r from-[#C9A02A]/50 via-[#004D36]/30 to-transparent" />

      <div className="relative flex h-full flex-col px-[8vw] py-[7vh]">
        <div className="mb-[4vh]">
          <p className="font-body text-[1.4vw] font-medium tracking-[0.2em] text-[#C9A02A] uppercase">
            Platform Capabilities
          </p>
          <h2 className="mt-[1vh] font-display text-[4.5vw] font-black leading-tight tracking-tight text-[#F0F5F2]">
            Built for Every Role
          </h2>
        </div>

        <div className="flex gap-[2vw] flex-1 max-h-[62vh]">
          <div className="flex-1 border-t-4 border-[#C9A02A] bg-[#004D36]/10 px-[2.5vw] pt-[3vh] pb-[2.5vh] flex flex-col">
            <p className="font-display text-[1.8vw] font-bold text-[#C9A02A] mb-[2.5vh]">Student / Faculty</p>
            <div className="space-y-[1.8vh] flex-1">
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#C9A02A] mt-[0.8vh] flex-shrink-0" />
                <p className="font-body text-[1.55vw] text-[#D4E4DB]">Real-time slot availability grid by zone</p>
              </div>
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#C9A02A] mt-[0.8vh] flex-shrink-0" />
                <p className="font-body text-[1.55vw] text-[#D4E4DB]">Map-guided navigation to reserved slot</p>
              </div>
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#C9A02A] mt-[0.8vh] flex-shrink-0" />
                <p className="font-body text-[1.55vw] text-[#D4E4DB]">QR-authenticated entry, live session timer</p>
              </div>
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#C9A02A] mt-[0.8vh] flex-shrink-0" />
                <p className="font-body text-[1.55vw] text-[#D4E4DB]">Parking history — full session log</p>
              </div>
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#C9A02A] mt-[0.8vh] flex-shrink-0" />
                <p className="font-body text-[1.55vw] text-[#D4E4DB]">Priority score, rank, and waiting list status</p>
              </div>
            </div>
          </div>

          <div className="flex-1 border-t-4 border-[#004D36] bg-[#004D36]/10 px-[2.5vw] pt-[3vh] pb-[2.5vh] flex flex-col">
            <p className="font-display text-[1.8vw] font-bold text-[#F0F5F2] mb-[2.5vh]">Admin / Security</p>
            <div className="space-y-[1.8vh] flex-1">
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#8BAA9E] mt-[0.8vh] flex-shrink-0" />
                <p className="font-body text-[1.55vw] text-[#D4E4DB]">Live analytics dashboard — occupancy, history</p>
              </div>
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#8BAA9E] mt-[0.8vh] flex-shrink-0" />
                <p className="font-body text-[1.55vw] text-[#D4E4DB]">QR scanner — scan to mark slot OCCUPIED</p>
              </div>
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#8BAA9E] mt-[0.8vh] flex-shrink-0" />
                <p className="font-body text-[1.55vw] text-[#D4E4DB]">Slot management — manual override controls</p>
              </div>
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#8BAA9E] mt-[0.8vh] flex-shrink-0" />
                <p className="font-body text-[1.55vw] text-[#D4E4DB]">User leaderboard — score-ranked priority list</p>
              </div>
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#8BAA9E] mt-[0.8vh] flex-shrink-0" />
                <p className="font-body text-[1.55vw] text-[#D4E4DB]">Peak-hour occupancy trends and zone analytics</p>
              </div>
            </div>
          </div>

          <div className="flex-1 border-t-4 border-[#C9A02A]/40 bg-[#C9A02A]/5 px-[2.5vw] pt-[3vh] pb-[2.5vh] flex flex-col">
            <p className="font-display text-[1.8vw] font-bold text-[#C9A02A]/80 mb-[2.5vh]">System Intelligence</p>
            <div className="space-y-[1.8vh] flex-1">
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#C9A02A]/50 mt-[0.8vh] flex-shrink-0" />
                <p className="font-body text-[1.55vw] text-[#D4E4DB]">Auto-release after 5-min reservation timeout</p>
              </div>
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#C9A02A]/50 mt-[0.8vh] flex-shrink-0" />
                <p className="font-body text-[1.55vw] text-[#D4E4DB]">Overstay scheduler — auto-penalizes at 10 min</p>
              </div>
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#C9A02A]/50 mt-[0.8vh] flex-shrink-0" />
                <p className="font-body text-[1.55vw] text-[#D4E4DB]">Faculty-only zone enforced at API level</p>
              </div>
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#C9A02A]/50 mt-[0.8vh] flex-shrink-0" />
                <p className="font-body text-[1.55vw] text-[#D4E4DB]">Vehicle plate format validation (AP 31 AC 2044)</p>
              </div>
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#C9A02A]/50 mt-[0.8vh] flex-shrink-0" />
                <p className="font-body text-[1.55vw] text-[#D4E4DB]">Secure session tokens — no double-reservation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
