export default function TechStackSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#061210]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_30%_50%,rgba(0,77,54,0.2),transparent_55%)]" />
      <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[#C9A02A]/30 to-transparent" />

      <div className="relative flex h-full px-[8vw] py-[7vh] gap-[6vw]">
        <div className="flex flex-col justify-center max-w-[30vw]">
          <p className="font-body text-[1.4vw] font-medium tracking-[0.2em] text-[#C9A02A] uppercase mb-[2vh]">
            Engineering Choices
          </p>
          <h2 className="font-display text-[4.5vw] font-black leading-tight tracking-tight text-[#F0F5F2]">
            Technology
            <span className="block text-[#C9A02A]">Stack</span>
          </h2>
          <p className="mt-[2.5vh] font-body text-[1.65vw] text-[#8BAA9E] leading-relaxed">
            Every layer chosen for real-world reliability, cross-platform delivery, 
            and developer productivity.
          </p>
          <div className="mt-[4vh] h-[2px] w-[6vw] bg-[#C9A02A]" />
        </div>

        <div className="flex-1 grid grid-cols-2 gap-[2vw] content-center">
          <div className="border border-[#004D36] bg-[#004D36]/10 rounded-sm p-[2vw]">
            <p className="font-body text-[1.3vw] font-semibold tracking-widest text-[#8BAA9E] uppercase mb-[1.5vh]">Mobile</p>
            <p className="font-display text-[2vw] font-bold text-[#F0F5F2]">React Native</p>
            <p className="font-body text-[1.45vw] text-[#8BAA9E] mt-[0.8vh]">Expo Router — iOS, Android & Web from one codebase</p>
          </div>

          <div className="border border-[#004D36] bg-[#004D36]/10 rounded-sm p-[2vw]">
            <p className="font-body text-[1.3vw] font-semibold tracking-widest text-[#8BAA9E] uppercase mb-[1.5vh]">Backend</p>
            <p className="font-display text-[2vw] font-bold text-[#F0F5F2]">Node.js + Fastify</p>
            <p className="font-body text-[1.45vw] text-[#8BAA9E] mt-[0.8vh]">High-performance REST API with structured logging</p>
          </div>

          <div className="border border-[#C9A02A]/30 bg-[#C9A02A]/5 rounded-sm p-[2vw]">
            <p className="font-body text-[1.3vw] font-semibold tracking-widest text-[#8BAA9E] uppercase mb-[1.5vh]">Database</p>
            <p className="font-display text-[2vw] font-bold text-[#C9A02A]">PostgreSQL + Drizzle ORM</p>
            <p className="font-body text-[1.45vw] text-[#8BAA9E] mt-[0.8vh]">Type-safe schema, relational integrity, real-time queries</p>
          </div>

          <div className="border border-[#004D36] bg-[#004D36]/10 rounded-sm p-[2vw]">
            <p className="font-body text-[1.3vw] font-semibold tracking-widest text-[#8BAA9E] uppercase mb-[1.5vh]">State & Data</p>
            <p className="font-display text-[2vw] font-bold text-[#F0F5F2]">TanStack Query</p>
            <p className="font-body text-[1.45vw] text-[#8BAA9E] mt-[0.8vh]">Smart cache, auto-refetch, optimistic updates across screens</p>
          </div>

          <div className="border border-[#004D36] bg-[#004D36]/10 rounded-sm p-[2vw]">
            <p className="font-body text-[1.3vw] font-semibold tracking-widest text-[#8BAA9E] uppercase mb-[1.5vh]">Mapping</p>
            <p className="font-display text-[2vw] font-bold text-[#F0F5F2]">Leaflet + OpenStreetMap</p>
            <p className="font-body text-[1.45vw] text-[#8BAA9E] mt-[0.8vh]">No API keys — open-source navigation and routing</p>
          </div>

          <div className="border border-[#004D36] bg-[#004D36]/10 rounded-sm p-[2vw]">
            <p className="font-body text-[1.3vw] font-semibold tracking-widest text-[#8BAA9E] uppercase mb-[1.5vh]">Automation</p>
            <p className="font-display text-[2vw] font-bold text-[#F0F5F2]">Node-Cron Scheduler</p>
            <p className="font-body text-[1.45vw] text-[#8BAA9E] mt-[0.8vh]">Background jobs for overstay detection and slot cleanup</p>
          </div>
        </div>
      </div>
    </div>
  );
}
