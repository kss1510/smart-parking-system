export default function PriorityEngineSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A1A12]">
      <div className="absolute top-0 left-0 w-[50vw] h-full bg-gradient-to-r from-[#004D36]/20 to-transparent" />
      <div className="absolute bottom-0 left-[8vw] right-[8vw] h-[2px] bg-gradient-to-r from-[#C9A02A]/50 to-transparent" />

      <div className="relative flex h-full px-[8vw] py-[7vh] gap-[5vw]">
        <div className="flex-1 flex flex-col justify-center">
          <p className="font-body text-[1.4vw] font-medium tracking-[0.2em] text-[#C9A02A] uppercase mb-[2vh]">
            The Differentiator
          </p>
          <h2 className="font-display text-[4.5vw] font-black leading-tight tracking-tight text-[#F0F5F2]">
            The Smart
            <span className="block text-[#C9A02A]">Priority Engine</span>
          </h2>
          <p className="mt-[2.5vh] font-body text-[1.7vw] text-[#8BAA9E] leading-relaxed">
            Not first-come, first-served. 
            A behavior-driven scoring system that rewards responsible users 
            and penalizes those who abuse the system.
          </p>

          <div className="mt-[3.5vh] space-y-[2vh]">
            <div className="flex items-center gap-[2vw]">
              <div className="text-[2.5vw] font-display font-black text-[#C9A02A] w-[4vw]">+1</div>
              <div>
                <p className="font-display text-[1.6vw] font-semibold text-[#F0F5F2]">Active Parking</p>
                <p className="font-body text-[1.45vw] text-[#8BAA9E]">Score rises while your vehicle is legitimately occupying a slot</p>
              </div>
            </div>
            <div className="flex items-center gap-[2vw]">
              <div className="text-[2.5vw] font-display font-black text-[#8BAA9E] w-[4vw]">0</div>
              <div>
                <p className="font-display text-[1.6vw] font-semibold text-[#F0F5F2]">Clean Exit</p>
                <p className="font-body text-[1.45vw] text-[#8BAA9E]">Exiting on time — no penalty, score stays intact</p>
              </div>
            </div>
            <div className="flex items-center gap-[2vw]">
              <div className="text-[2.5vw] font-display font-black text-red-400 w-[4vw]">-1</div>
              <div>
                <p className="font-display text-[1.6vw] font-semibold text-[#F0F5F2]">Overstay Penalty</p>
                <p className="font-body text-[1.45vw] text-[#8BAA9E]">Exceeding 10 minutes — auto-flagged by the scheduler</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[32vw] flex flex-col justify-center gap-[2.5vh]">
          <div className="border border-[#C9A02A]/40 bg-[#C9A02A]/5 rounded-sm p-[2.5vw]">
            <p className="font-display text-[1.7vw] font-bold text-[#C9A02A] mb-[1.5vh]">Waiting List Logic</p>
            <p className="font-body text-[1.5vw] text-[#8BAA9E] leading-relaxed">
              Users with negative scores can only enter the waiting list when 
              all higher-scored users are already served — fairness is enforced algorithmically.
            </p>
          </div>

          <div className="border border-[#004D36] bg-[#004D36]/10 rounded-sm p-[2.5vw]">
            <p className="font-display text-[1.7vw] font-bold text-[#F0F5F2] mb-[1.5vh]">Live Leaderboard</p>
            <p className="font-body text-[1.5vw] text-[#8BAA9E] leading-relaxed">
              Real-time campus-wide ranking by score — transparency drives better behavior. 
              Top scorers earn faster access and priority slots.
            </p>
          </div>

          <div className="border border-[#004D36] bg-[#004D36]/10 rounded-sm p-[2.5vw]">
            <p className="font-display text-[1.7vw] font-bold text-[#F0F5F2] mb-[1.5vh]">Faculty Priority</p>
            <p className="font-body text-[1.5vw] text-[#8BAA9E] leading-relaxed">
              Zone C is faculty-only — no overrides, enforced at reservation level with role-based access control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
