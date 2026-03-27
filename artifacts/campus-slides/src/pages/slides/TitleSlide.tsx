const base = import.meta.env.BASE_URL;

export default function TitleSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A1A12]">
      <img
        src={`${base}hero-parking.png`}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        alt="Campus parking aerial view"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A1A12] via-[#0A1A12]/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A12] via-transparent to-transparent" />

      <div className="relative flex h-full flex-col justify-between px-[8vw] py-[7vh]">
        <div className="flex items-center gap-[1.5vw]">
          <div className="h-[0.6vh] w-[4vw] bg-[#C9A02A]" />
          <span className="font-body text-[1.5vw] font-semibold tracking-[0.22em] text-[#C9A02A] uppercase">
            GITAM University
          </span>
        </div>

        <div className="max-w-[62vw]">
          <div className="mb-[2vh] inline-block rounded-sm bg-[#004D36]/60 border border-[#004D36] px-[1.5vw] py-[0.8vh]">
            <span className="font-body text-[1.5vw] font-medium tracking-widest text-[#8BAA9E] uppercase">
              Final Year Project — 2026
            </span>
          </div>
          <h1 className="font-display text-[7.5vw] font-black leading-[0.9] tracking-tighter text-[#F0F5F2]">
            Campus
            <span className="text-[#C9A02A]">Park</span>
          </h1>
          <p className="mt-[2.5vh] font-body text-[2.1vw] font-light leading-snug text-[#8BAA9E]">
            Smart Campus Parking Management System
          </p>
          <p className="mt-[1.5vh] font-body text-[1.6vw] text-[#F0F5F2]/60">
            Zone-Based · QR-Authenticated · Priority-Driven
          </p>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="font-body text-[1.4vw] text-[#F0F5F2]/50">Presented by</p>
            <p className="font-display text-[1.8vw] font-semibold text-[#F0F5F2]/80">
              [Team Name]
            </p>
          </div>
          <div className="text-right">
            <p className="font-body text-[1.4vw] text-[#F0F5F2]/50">Department of Computer Science</p>
            <p className="font-body text-[1.4vw] text-[#F0F5F2]/50">March 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
