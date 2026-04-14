export default function SocialPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-8 pb-24">
      {/* Location Selector */}
      <div className="flex items-center gap-1.5 mb-8">
        <button className="flex items-center gap-1.5 group">
          <span className="text-on-surface-variant font-label text-sm tracking-wide group-hover:text-on-surface transition-colors">
            Korea
          </span>
          <span className="text-outline-variant font-label text-sm">&gt;</span>
          <span className="text-primary font-headline font-bold text-sm tracking-tight group-hover:text-primary-dim transition-colors">
            Seoul
          </span>
          <span className="material-symbols-outlined text-primary text-[18px] transition-transform group-hover:translate-y-0.5">
            expand_more
          </span>
        </button>
      </div>

      {/* Weekly Calendar */}
      <section className="mb-10">
        <div className="bg-surface-container-low rounded-xl p-2 flex justify-between items-center gap-1 shadow-sm font-sans">
          {/* Active Day: 14th (Wed) */}
          <button className="flex-1 flex flex-col items-center py-3 bg-primary rounded-xl shadow-lg shadow-primary/20 ring-4 ring-primary-container">
            <span className="text-[10px] font-label font-bold text-on-primary uppercase tracking-tighter mb-1">
              WED
            </span>
            <span className="text-lg font-headline font-extrabold text-on-primary">
              14
            </span>
          </button>
          <button className="flex-1 flex flex-col items-center py-3 rounded-xl transition-all hover:bg-surface-container-highest">
            <span className="text-[10px] font-label font-bold text-secondary uppercase tracking-tighter mb-1">
              THU
            </span>
            <span className="text-lg font-headline font-extrabold text-on-surface">
              15
            </span>
          </button>
          <button className="flex-1 flex flex-col items-center py-3 rounded-xl transition-all hover:bg-surface-container-highest">
            <span className="text-[10px] font-label font-bold text-secondary uppercase tracking-tighter mb-1">
              FRI
            </span>
            <span className="text-lg font-headline font-extrabold text-on-surface">
              16
            </span>
          </button>
          <button className="flex-1 flex flex-col items-center py-3 rounded-xl transition-all hover:bg-surface-container-highest">
            <span className="text-[10px] font-label font-bold text-secondary uppercase tracking-tighter mb-1">
              SAT
            </span>
            <span className="text-lg font-headline font-extrabold text-on-surface">
              17
            </span>
          </button>
          <button className="flex-1 flex flex-col items-center py-3 rounded-xl transition-all hover:bg-surface-container-highest">
            <span className="text-[10px] font-label font-bold text-secondary uppercase tracking-tighter mb-1">
              SUN
            </span>
            <span className="text-lg font-headline font-extrabold text-on-surface">
              18
            </span>
          </button>
          <button className="flex-1 flex flex-col items-center py-3 rounded-xl transition-all hover:bg-surface-container-highest">
            <span className="text-[10px] font-label font-bold text-secondary uppercase tracking-tighter mb-1">
              MON
            </span>
            <span className="text-lg font-headline font-extrabold text-on-surface">
              19
            </span>
          </button>
          <button className="flex-1 flex flex-col items-center py-3 rounded-xl transition-all hover:bg-surface-container-highest">
            <span className="text-[10px] font-label font-bold text-secondary uppercase tracking-tighter mb-1">
              TUE
            </span>
            <span className="text-lg font-headline font-extrabold text-on-surface">
              20
            </span>
          </button>
        </div>
      </section>

      {/* Regular Socials */}
      <section className="mb-12">
        <h2 className="font-headline text-2xl font-extrabold tracking-tight mb-6 flex items-center gap-2">
          Regular Socials
          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
        </h2>
        <div className="flex overflow-x-auto no-scrollbar gap-5 -mx-6 px-6">
          {/* Event Card 1 */}
          <div className="relative flex-none w-[280px] h-[400px] rounded-xl overflow-hidden shadow-xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAgR2T-RkVscF23rQ3loTmaY2aUTKy8JqX-JHnLBQ1JzyA8M38EBfm4dzBqe0AzpmAs0ruhL_VXPPP-WWL8xarR1XeK5vTD1JVHJMkE5_S0GDtSKtTxneHwI1QnRPFySTfAYW9H14rLQwPYTJJFuLEsuKNYwwlNgUk-tHZStE8LEXHA2_oKTCUS-QjtIyC6f36R-n1wFRr2xgHRR1xfVJqpKr8e295mNi5VcldrLdOCyhLBlqNBP19FuVJ4A_lARh5-8CedgoAr91tV')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 w-full">
              <div className="mb-4">
                <span className="text-sm font-label font-semibold tracking-wide text-primary-fixed mb-1 block">
                  Stone Hong
                </span>
                <h3 className="text-2xl font-headline font-extrabold text-white leading-tight">
                  Milonga El Abrazo
                </h3>
              </div>
              <div className="space-y-1.5 border-l-2 border-primary/60 pl-3">
                <p className="text-white/90 text-sm font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">
                    location_on
                  </span>{" "}
                  Gangnam Studio A
                </p>
                <p className="text-white/90 text-sm font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">
                    schedule
                  </span>{" "}
                  19:30 - 23:00
                </p>
                <p className="text-primary-fixed text-sm font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">
                    music_note
                  </span>{" "}
                  DJ Marcello
                </p>
              </div>
            </div>
          </div>

          {/* Event Card 2 */}
          <div className="relative flex-none w-[280px] h-[400px] rounded-xl overflow-hidden shadow-xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB6GXKqJO9aV9hTE0_OQvBPrcT_rqvr5jrC_cK7Hqkv7mPPChWIygYCt803WsvODmGsQP2hyJWEIqmMi_KA-KhFWlgWW-tKy6RbN25L0_TPgmmV_GsNzZdUGM0bsWVa6NsCYgzS4bOhuvdNHxWBWlMni_N6d-wvrJK6SWnXNChBgfqqj1q9u8f6Yd4cvS6rfNQY3z-aZFkoxEgNKghuiN1ObOBPnxlT8sJwFuEDhnMvzYTHSFAc2h3a4brVwfJoRgOWRgyJD3JpPIoV')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 w-full">
              <div className="mb-4">
                <span className="text-sm font-label font-semibold tracking-wide text-primary-fixed mb-1 block">
                  Stone Hong
                </span>
                <h3 className="text-2xl font-headline font-extrabold text-white leading-tight">
                  Luna Tango Social
                </h3>
              </div>
              <div className="space-y-1.5 border-l-2 border-primary/60 pl-3">
                <p className="text-white/90 text-sm font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">
                    location_on
                  </span>{" "}
                  Hongdae Blue Hall
                </p>
                <p className="text-white/90 text-sm font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">
                    schedule
                  </span>{" "}
                  20:00 - 00:00
                </p>
                <p className="text-primary-fixed text-sm font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">
                    music_note
                  </span>{" "}
                  DJ Elena K.
                </p>
              </div>
            </div>
          </div>
          {/* Spacer for scroll */}
          <div className="flex-none w-1"></div>
        </div>
      </section>

      {/* Popup Socials */}
      <section className="mb-8">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-headline text-2xl font-extrabold tracking-tight">
            Popup Socials
          </h2>
          <span className="text-xs font-label text-secondary tracking-widest uppercase pb-1">
            Limited Events
          </span>
        </div>
        <div className="space-y-6">
          {/* Popup Item 1 */}
          <div className="group border-l-4 border-primary/20 hover:border-primary pl-6 py-1 transition-all">
            <span className="text-[10px] font-label font-bold text-primary uppercase tracking-[0.15em] mb-1 block">
              MARCH 14 (WED)
            </span>
            <h4 className="text-lg font-headline font-bold text-on-surface mb-2">
              After-Work Practice Night
            </h4>
            <div className="space-y-1">
              <div className="flex items-center gap-4 text-sm text-on-surface-variant font-medium">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    location_on
                  </span>{" "}
                  Itaewon Salon
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    schedule
                  </span>{" "}
                  18:00 - 21:00
                </span>
              </div>
              <p className="text-sm text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">
                  music_note
                </span>{" "}
                Curated Playlist
              </p>
            </div>
          </div>
          {/* Popup Item 2 */}
          <div className="group border-l-4 border-primary/20 hover:border-primary pl-6 py-1 transition-all">
            <span className="text-[10px] font-label font-bold text-primary uppercase tracking-[0.15em] mb-1 block">
              MARCH 15 (THU)
            </span>
            <h4 className="text-lg font-headline font-bold text-on-surface mb-2">
              Guest DJ Night: Buenos Aires Vibes
            </h4>
            <div className="space-y-1">
              <div className="flex items-center gap-4 text-sm text-on-surface-variant font-medium">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    location_on
                  </span>{" "}
                  Grand Ballroom
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    schedule
                  </span>{" "}
                  21:00 - 02:00
                </span>
              </div>
              <p className="text-sm text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">
                  music_note
                </span>{" "}
                DJ Rodolfo Garcés
              </p>
            </div>
          </div>
          {/* Popup Item 3 */}
          <div className="group border-l-4 border-primary/20 hover:border-primary pl-6 py-1 transition-all">
            <span className="text-[10px] font-label font-bold text-primary uppercase tracking-[0.15em] mb-1 block">
              MARCH 17 (SAT)
            </span>
            <h4 className="text-lg font-headline font-bold text-on-surface mb-2">
              Tango Garden Party
            </h4>
            <div className="space-y-1">
              <div className="flex items-center gap-4 text-sm text-on-surface-variant font-medium">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    location_on
                  </span>{" "}
                  Namsan Terrace
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    schedule
                  </span>{" "}
                  15:00 - 19:00
                </span>
              </div>
              <p className="text-sm text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">
                  music_note
                </span>{" "}
                DJ Sunny
              </p>
            </div>
          </div>
          {/* Popup Item 4 */}
          <div className="group border-l-4 border-primary/20 hover:border-primary pl-6 py-1 transition-all">
            <span className="text-[10px] font-label font-bold text-primary uppercase tracking-[0.15em] mb-1 block">
              MARCH 18 (SUN)
            </span>
            <h4 className="text-lg font-headline font-bold text-on-surface mb-2">
              Farewell Tea Milonga
            </h4>
            <div className="space-y-1">
              <div className="flex items-center gap-4 text-sm text-on-surface-variant font-medium">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    location_on
                  </span>{" "}
                  Tea Room 404
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    schedule
                  </span>{" "}
                  14:00 - 18:00
                </span>
              </div>
              <p className="text-sm text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">
                  music_note
                </span>{" "}
                DJ Min-ho
              </p>
            </div>
          </div>
          {/* Popup Item 5 */}
          <div className="group border-l-4 border-primary/20 hover:border-primary pl-6 py-1 transition-all">
            <span className="text-[10px] font-label font-bold text-primary uppercase tracking-[0.15em] mb-1 block">
              MARCH 20 (TUE)
            </span>
            <h4 className="text-lg font-headline font-bold text-on-surface mb-2">
              Vintage Vinyl Social
            </h4>
            <div className="space-y-1">
              <div className="flex items-center gap-4 text-sm text-on-surface-variant font-medium">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    location_on
                  </span>{" "}
                  Archive Basement
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    schedule
                  </span>{" "}
                  20:30 - 23:30
                </span>
              </div>
              <p className="text-sm text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">
                  music_note
                </span>{" "}
                DJ Old School
              </p>
            </div>
          </div>
        </div>
        {/* More Button */}
        <div className="mt-12 flex justify-center">
          <button className="group flex items-center gap-2 px-8 py-3 rounded-full border border-outline-variant hover:border-primary transition-all">
            <span className="text-sm font-label font-bold text-secondary group-hover:text-primary tracking-widest uppercase transition-colors">
              More..
            </span>
            <span className="material-symbols-outlined text-[18px] text-outline-variant group-hover:text-primary group-hover:translate-x-1 transition-all">
              arrow_forward
            </span>
          </button>
        </div>
      </section>
    </main>
  );
}
