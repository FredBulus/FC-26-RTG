import { BookOpenCheck } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { siteContent } from "@/lib/site-content";

export const revalidate = 0;

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Rules" title="League Rules">
        {siteContent.rulesIntro}
      </PageTitle>

      <section className="rounded-md border border-line bg-ink p-4 text-white shadow-glow">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan">
              Prize List
            </p>
            <h2 className="text-2xl font-black">Season Rewards</h2>
          </div>
          <p className="text-sm font-semibold text-white/65">Registration: N5,000</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {siteContent.prizeList.map((prize) => (
            <div key={prize.place} className="rounded-md bg-white/8 p-3">
              <p className="text-sm font-black text-cyan">{prize.place}</p>
              <p className="mt-1 text-xl font-black text-gold">{prize.amount}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {siteContent.rules.map((section) => (
          <article
            key={section.title}
            className="overflow-hidden rounded-md border border-line bg-white shadow-glow"
          >
            <div className="h-1 bg-gradient-to-r from-[#ff2882] via-cyan to-turf" />
            <div className="p-4">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-ink text-cyan">
                  <BookOpenCheck size={20} />
                </span>
                <h2 className="text-xl font-black text-ink">{section.title}</h2>
              </div>
              <ul className="space-y-3">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm font-semibold leading-6 text-ink/70">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#ff2882]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
