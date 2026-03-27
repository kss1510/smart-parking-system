export default function TechArchSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#061210]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_15%_50%,rgba(0,77,54,0.22),transparent_50%),radial-gradient(ellipse_at_85%_50%,rgba(201,160,42,0.06),transparent_50%)]" />
      <div className="absolute top-0 left-0 right-0 h-[0.4vh] bg-gradient-to-r from-[#004D36] via-[#C9A02A] to-[#004D36]" />

      <div className="relative flex h-full flex-col px-[7vw] py-[6vh]">
        <div className="mb-[3.5vh]">
          <p className="font-body text-[1.4vw] font-medium tracking-[0.2em] text-[#C9A02A] uppercase">
            System Design
          </p>
          <h2 className="mt-[0.8vh] font-display text-[4.2vw] font-black leading-tight tracking-tight text-[#F0F5F2]">
            Technical Architecture
          </h2>
        </div>

        <div className="flex gap-[2.5vw] flex-1 max-h-[68vh]">
          <div className="flex flex-col gap-[2vh] w-[20vw]">
            <div className="border border-[#004D36] bg-[#004D36]/15 rounded-sm p-[2vw] flex-1">
              <p className="font-body text-[1.2vw] font-semibold tracking-widest text-[#C9A02A] uppercase mb-[1.5vh]">
                Client Layer
              </p>
              <p className="font-display text-[1.6vw] font-bold text-[#F0F5F2] mb-[1vh]">
                React Native + Expo
              </p>
              <div className="space-y-[1vh]">
                <p className="font-body text-[1.4vw] text-[#8BAA9E]">Expo Router — file-based navigation</p>
                <p className="font-body text-[1.4vw] text-[#8BAA9E]">TanStack Query — cache + polling</p>
                <p className="font-body text-[1.4vw] text-[#8BAA9E]">AsyncStorage — session persistence</p>
                <p className="font-body text-[1.4vw] text-[#8BAA9E]">WebView + Leaflet — map navigation</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-[1vh] w-[6vw]">
            <div className="font-display text-[1.4vw] font-bold text-[#C9A02A]/70 text-center">REST</div>
            <div className="flex flex-col items-center gap-[0.5vh]">
              <div className="w-[2px] h-[3vh] bg-[#C9A02A]/50" />
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-[#C9A02A]/50" />
            </div>
            <div className="w-[4vw] h-[2px] bg-[#C9A02A]/50" />
            <div className="flex flex-col items-center gap-[0.5vh]">
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-[#C9A02A]/50" />
              <div className="w-[2px] h-[3vh] bg-[#C9A02A]/50" />
            </div>
            <div className="font-body text-[1.2vw] text-[#8BAA9E] text-center">JSON / HTTPS</div>
          </div>

          <div className="flex flex-col gap-[2vh] w-[22vw]">
            <div className="border border-[#C9A02A]/40 bg-[#C9A02A]/5 rounded-sm p-[2vw] flex-1">
              <p className="font-body text-[1.2vw] font-semibold tracking-widest text-[#C9A02A] uppercase mb-[1.5vh]">
                API Layer
              </p>
              <p className="font-display text-[1.6vw] font-bold text-[#F0F5F2] mb-[1vh]">
                Node.js + Fastify
              </p>
              <div className="space-y-[1vh]">
                <p className="font-body text-[1.4vw] text-[#8BAA9E]">JWT auth + role-based access</p>
                <p className="font-body text-[1.4vw] text-[#8BAA9E]">Zod schema validation on all routes</p>
                <p className="font-body text-[1.4vw] text-[#8BAA9E]">node-cron — background scheduler</p>
                <p className="font-body text-[1.4vw] text-[#8BAA9E]">Token-based QR code generation</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-[1vh] w-[6vw]">
            <div className="font-display text-[1.4vw] font-bold text-[#8BAA9E]/70 text-center">ORM</div>
            <div className="flex flex-col items-center gap-[0.5vh]">
              <div className="w-[2px] h-[3vh] bg-[#8BAA9E]/40" />
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-[#8BAA9E]/40" />
            </div>
            <div className="w-[4vw] h-[2px] bg-[#8BAA9E]/40" />
            <div className="flex flex-col items-center gap-[0.5vh]">
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-[#8BAA9E]/40" />
              <div className="w-[2px] h-[3vh] bg-[#8BAA9E]/40" />
            </div>
            <div className="font-body text-[1.2vw] text-[#8BAA9E] text-center">Drizzle</div>
          </div>

          <div className="flex flex-col gap-[2vh] flex-1">
            <div className="border border-[#004D36] bg-[#004D36]/15 rounded-sm p-[2vw] flex-1">
              <p className="font-body text-[1.2vw] font-semibold tracking-widest text-[#C9A02A] uppercase mb-[1.5vh]">
                Data Layer
              </p>
              <p className="font-display text-[1.6vw] font-bold text-[#F0F5F2] mb-[1vh]">
                PostgreSQL + Drizzle ORM
              </p>
              <div className="space-y-[1vh]">
                <p className="font-body text-[1.4vw] text-[#8BAA9E]">users · zones · slots · parking_sessions</p>
                <p className="font-body text-[1.4vw] text-[#8BAA9E]">waiting_list · parking_history</p>
                <p className="font-body text-[1.4vw] text-[#8BAA9E]">Type-safe queries, relational joins</p>
                <p className="font-body text-[1.4vw] text-[#8BAA9E]">Priority scores stored per user</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-[2.5vh] flex gap-[2vw]">
          <div className="flex-1 border-l-2 border-[#C9A02A] pl-[1.5vw] py-[0.5vh]">
            <p className="font-display text-[1.5vw] font-semibold text-[#F0F5F2]">Polling Strategy</p>
            <p className="font-body text-[1.4vw] text-[#8BAA9E]">5-second intervals on active parking — no websockets needed, lightweight and reliable</p>
          </div>
          <div className="flex-1 border-l-2 border-[#C9A02A] pl-[1.5vw] py-[0.5vh]">
            <p className="font-display text-[1.5vw] font-semibold text-[#F0F5F2]">Plate Validation</p>
            <p className="font-body text-[1.4vw] text-[#8BAA9E]">Regex enforced client + server — format: AP 31 AC 2044 (2L·2D·2L·4D)</p>
          </div>
          <div className="flex-1 border-l-2 border-[#C9A02A] pl-[1.5vw] py-[0.5vh]">
            <p className="font-display text-[1.5vw] font-semibold text-[#F0F5F2]">Scheduler</p>
            <p className="font-body text-[1.4vw] text-[#8BAA9E]">node-cron job runs every 60s — auto-expires reservations, flags overstays at 10 min</p>
          </div>
        </div>
      </div>
    </div>
  );
}
