export default function ApproachSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#004D36]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_80%_20%,rgba(201,160,42,0.12),transparent_50%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-[35vh] bg-gradient-to-t from-[#003326] to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-[1vh] bg-[#C9A02A]" />

      <div className="relative flex h-full flex-col justify-center px-[8vw]">
        <div className="max-w-[60vw]">
          <p className="font-body text-[1.5vw] font-semibold tracking-[0.22em] text-[#C9A02A] uppercase mb-[2vh]">
            Our Approach
          </p>
          <h2 className="font-display text-[5.5vw] font-black leading-[0.92] tracking-tight text-[#F0F5F2]">
            Rethink Parking from
            <span className="block text-[#C9A02A]">the Ground Up</span>
          </h2>
          <p className="mt-[3vh] font-body text-[1.9vw] text-[#D4E4DB] leading-relaxed max-w-[52vw]">
            CampusPark replaces chaos with a real-time, behavior-aware, 
            QR-authenticated parking system — purpose-built for university campuses.
          </p>
        </div>

        <div className="mt-[5vh] flex gap-[3vw]">
          <div className="flex items-start gap-[1.5vw]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-sm bg-[#C9A02A]/20 border border-[#C9A02A]/40 flex items-center justify-center flex-shrink-0">
              <div className="w-[1.5vw] h-[1.5vw] bg-[#C9A02A] rounded-sm" />
            </div>
            <div>
              <p className="font-display text-[1.7vw] font-bold text-[#F0F5F2]">Zone-Based Reservation</p>
              <p className="font-body text-[1.5vw] text-[#8BAA9E] mt-[0.5vh]">3 zones, 30 slots — reserved in seconds via mobile</p>
            </div>
          </div>

          <div className="flex items-start gap-[1.5vw]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-sm bg-[#C9A02A]/20 border border-[#C9A02A]/40 flex items-center justify-center flex-shrink-0">
              <div className="w-[1.5vw] h-[1.5vw] bg-[#C9A02A] rounded-sm" />
            </div>
            <div>
              <p className="font-display text-[1.7vw] font-bold text-[#F0F5F2]">QR-Authenticated Entry</p>
              <p className="font-body text-[1.5vw] text-[#8BAA9E] mt-[0.5vh]">Secure, tamper-proof scan-to-enter with live guard validation</p>
            </div>
          </div>

          <div className="flex items-start gap-[1.5vw]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-sm bg-[#C9A02A]/20 border border-[#C9A02A]/40 flex items-center justify-center flex-shrink-0">
              <div className="w-[1.5vw] h-[1.5vw] bg-[#C9A02A] rounded-sm" />
            </div>
            <div>
              <p className="font-display text-[1.7vw] font-bold text-[#F0F5F2]">Priority-Driven Fairness</p>
              <p className="font-body text-[1.5vw] text-[#8BAA9E] mt-[0.5vh]">Behavior score governs queue access — good actors park first</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
