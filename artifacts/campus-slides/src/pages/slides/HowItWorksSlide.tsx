export default function HowItWorksSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A1A12]">
      <div className="absolute top-0 right-0 w-[30vw] h-full bg-gradient-to-l from-[#004D36]/20 to-transparent" />
      <div className="absolute top-[7vh] left-[8vw] right-[8vw] h-[2px] bg-gradient-to-r from-[#C9A02A]/50 via-[#C9A02A]/20 to-transparent" />

      <div className="relative flex h-full flex-col px-[8vw] py-[7vh]">
        <div className="mb-[5vh]">
          <p className="font-body text-[1.4vw] font-medium tracking-[0.2em] text-[#C9A02A] uppercase">
            System Flow
          </p>
          <h2 className="mt-[1vh] font-display text-[4.5vw] font-black leading-tight tracking-tight text-[#F0F5F2]">
            How CampusPark Works
          </h2>
        </div>

        <div className="flex items-stretch gap-0 flex-1 max-h-[58vh]">
          <div className="flex-1 flex flex-col items-center px-[1.5vw]">
            <div className="w-[4.5vw] h-[4.5vw] rounded-full bg-[#004D36] border-2 border-[#C9A02A] flex items-center justify-center mb-[2.5vh]">
              <span className="font-display text-[2vw] font-black text-[#C9A02A]">1</span>
            </div>
            <div className="text-center">
              <p className="font-display text-[1.7vw] font-bold text-[#F0F5F2] mb-[1vh]">Reserve</p>
              <p className="font-body text-[1.45vw] text-[#8BAA9E] leading-snug">
                Open app, pick a zone, select an available slot, submit vehicle number
              </p>
            </div>
          </div>

          <div className="flex items-center px-[0.5vw]">
            <div className="h-[2px] w-[3vw] bg-[#C9A02A]/40" />
          </div>

          <div className="flex-1 flex flex-col items-center px-[1.5vw]">
            <div className="w-[4.5vw] h-[4.5vw] rounded-full bg-[#004D36] border-2 border-[#C9A02A] flex items-center justify-center mb-[2.5vh]">
              <span className="font-display text-[2vw] font-black text-[#C9A02A]">2</span>
            </div>
            <div className="text-center">
              <p className="font-display text-[1.7vw] font-bold text-[#F0F5F2] mb-[1vh]">Navigate</p>
              <p className="font-body text-[1.45vw] text-[#8BAA9E] leading-snug">
                Live map shows route from campus entry to reserved slot — tap Start to begin
              </p>
            </div>
          </div>

          <div className="flex items-center px-[0.5vw]">
            <div className="h-[2px] w-[3vw] bg-[#C9A02A]/40" />
          </div>

          <div className="flex-1 flex flex-col items-center px-[1.5vw]">
            <div className="w-[4.5vw] h-[4.5vw] rounded-full bg-[#004D36] border-2 border-[#C9A02A] flex items-center justify-center mb-[2.5vh]">
              <span className="font-display text-[2vw] font-black text-[#C9A02A]">3</span>
            </div>
            <div className="text-center">
              <p className="font-display text-[1.7vw] font-bold text-[#F0F5F2] mb-[1vh]">Arrive</p>
              <p className="font-body text-[1.45vw] text-[#8BAA9E] leading-snug">
                Tap "Arrived" — QR code is revealed. A 5-minute window begins automatically
              </p>
            </div>
          </div>

          <div className="flex items-center px-[0.5vw]">
            <div className="h-[2px] w-[3vw] bg-[#C9A02A]/40" />
          </div>

          <div className="flex-1 flex flex-col items-center px-[1.5vw]">
            <div className="w-[4.5vw] h-[4.5vw] rounded-full bg-[#004D36] border-2 border-[#C9A02A] flex items-center justify-center mb-[2.5vh]">
              <span className="font-display text-[2vw] font-black text-[#C9A02A]">4</span>
            </div>
            <div className="text-center">
              <p className="font-display text-[1.7vw] font-bold text-[#F0F5F2] mb-[1vh]">QR Scan</p>
              <p className="font-body text-[1.45vw] text-[#8BAA9E] leading-snug">
                Guard scans QR — slot becomes OCCUPIED, session timer starts in the app
              </p>
            </div>
          </div>

          <div className="flex items-center px-[0.5vw]">
            <div className="h-[2px] w-[3vw] bg-[#C9A02A]/40" />
          </div>

          <div className="flex-1 flex flex-col items-center px-[1.5vw]">
            <div className="w-[4.5vw] h-[4.5vw] rounded-full bg-[#C9A02A] border-2 border-[#C9A02A] flex items-center justify-center mb-[2.5vh]">
              <span className="font-display text-[2vw] font-black text-[#0A1A12]">5</span>
            </div>
            <div className="text-center">
              <p className="font-display text-[1.7vw] font-bold text-[#C9A02A] mb-[1vh]">Exit</p>
              <p className="font-body text-[1.45vw] text-[#8BAA9E] leading-snug">
                Tap Exit when done — slot freed instantly, session logged to history
              </p>
            </div>
          </div>
        </div>

        <div className="mt-[3vh] border-l-4 border-[#C9A02A] pl-[2vw]">
          <p className="font-body text-[1.55vw] text-[#8BAA9E]">
            Reservations expire in 5 minutes if unclaimed — the slot is automatically released back to the pool.
          </p>
        </div>
      </div>
    </div>
  );
}
