export default function ClosingSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#004D36]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_20%_80%,rgba(0,51,38,0.8),transparent_50%),radial-gradient(ellipse_at_80%_20%,rgba(201,160,42,0.12),transparent_45%)]" />
      <div className="absolute top-0 left-0 right-0 h-[0.6vh] bg-[#C9A02A]" />
      <div className="absolute bottom-0 left-0 right-0 h-[0.3vh] bg-[#C9A02A]/40" />

      <div className="relative flex h-full flex-col items-center justify-center px-[8vw] text-center">
        <div className="mb-[2vh]">
          <div className="inline-flex items-center gap-[1.5vw] mb-[4vh]">
            <div className="h-[2px] w-[4vw] bg-[#C9A02A]/50" />
            <span className="font-body text-[1.5vw] font-semibold tracking-[0.22em] text-[#C9A02A]/70 uppercase">
              GITAM University — 2026
            </span>
            <div className="h-[2px] w-[4vw] bg-[#C9A02A]/50" />
          </div>

          <h1 className="font-display text-[8vw] font-black leading-[0.9] tracking-tight text-[#F0F5F2]">
            Campus<span className="text-[#C9A02A]">Park</span>
          </h1>

          <p className="mt-[2vh] font-body text-[2.2vw] font-light text-[#D4E4DB]/80">
            Smarter parking. Fairer access. A campus that works.
          </p>
        </div>

        <div className="mt-[6vh] border border-[#C9A02A]/30 bg-[#C9A02A]/5 rounded-sm px-[5vw] py-[3vh] max-w-[50vw]">
          <p className="font-display text-[2.2vw] font-semibold text-[#F0F5F2]">
            Thank You
          </p>
          <p className="mt-[1.5vh] font-body text-[1.6vw] text-[#8BAA9E]">
            Open for questions and discussion
          </p>
        </div>

        <div className="mt-[5vh] flex items-center gap-[3vw]">
          <div className="text-center">
            <p className="font-body text-[1.3vw] text-[#8BAA9E]">Built with</p>
            <p className="font-display text-[1.5vw] font-bold text-[#F0F5F2]">React Native · Node.js · PostgreSQL</p>
          </div>
          <div className="w-[1px] h-[5vh] bg-[#C9A02A]/30" />
          <div className="text-center">
            <p className="font-body text-[1.3vw] text-[#8BAA9E]">Deployed on</p>
            <p className="font-display text-[1.5vw] font-bold text-[#F0F5F2]">Replit · Expo</p>
          </div>
          <div className="w-[1px] h-[5vh] bg-[#C9A02A]/30" />
          <div className="text-center">
            <p className="font-body text-[1.3vw] text-[#8BAA9E]">Presented by</p>
            <p className="font-display text-[1.5vw] font-bold text-[#F0F5F2]">[Team Name]</p>
          </div>
        </div>
      </div>
    </div>
  );
}
