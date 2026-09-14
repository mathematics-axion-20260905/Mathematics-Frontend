"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, FileDown, Sigma } from "lucide-react";

import { AnimatedMathSurface } from "@/components/home/animated-math-surface";
import { useLocale } from "@/components/locale-provider";

const defaultPromises = [
  ["Solve", "Use exact symbolic methods, numerical checks and explicit assumptions."],
  ["Visualize", "Inspect 2D, 3D and animated scientific output as part of the result."],
  ["Preserve", "Keep the result structured, reproducible and available to the Project."],
];

const defaultWorkflow = [
  ["01", "Problem", "Enter the mathematical question once, with assumptions and bounds kept explicit."],
  ["02", "Visualize", "Make geometry visible before the result is reduced to a number or expression."],
  ["03", "Solve", "Prefer exact forms, then use numerical methods to verify or extend them."],
  ["04", "Interpret", "Keep derivation, diagnostics and meaning beside the primary result."],
  ["05", "Save", "Preserve the scientific object so Notebook and Writer can continue the work."],
];

const mathLandingCopy = {
  en: {
    kicker: "MathSphere Laboratory · scientific computation", title: ["Scientific computation", "with inspectable", "results."], lead: "Solve mathematical problems, compare exact and numerical methods, and preserve complete results for downstream research.", open: "Open Laboratory", explore: "Product overview",
    productKicker: "Product overview", productTitle: "A mathematical workspace organized around the result.", productCopy: "Enter a problem once, then move from exact form to numerical verification, geometry, interpretation and export. Each stage exposes the information needed to assess the result.",
    workflowKicker: "Working method", workflowTitle: "A clear path from problem to reusable result.", workflowCopy: "The workflow keeps the problem, method and evidence together. Advanced analysis remains available without competing with the primary result.",
    ecosystemKicker: "Research continuity", ecosystemTitle: "Results remain usable after computation.", ecosystemCopy: "Math is one instrument in the Project. Save a result once, examine it in Notebook, and use the same Scientific Object in Writer without recreating the calculation.",
    finalTitle: ["A mathematical result should remain", "verifiable."], finalCopy: "Use a focused laboratory for exact computation, numerical checks, visualization and structured scientific output.",
  },
  uz: {
    kicker: "MathSphere laboratoriyasi · ilmiy hisoblash", title: ["Tekshiriladigan", "natijalarga ega", "ilmiy hisoblash."], lead: "Matematik masalalarni yeching, aniq va sonli usullarni taqqoslang hamda to‘liq natijani keyingi tadqiqotlar uchun saqlang.", open: "Laboratoriyani ochish", explore: "Mahsulot haqida",
    productKicker: "Mahsulot haqida", productTitle: "Natija markazida tashkil etilgan matematik ish maydoni.", productCopy: "Masalani bir marta kiriting, so‘ng aniq shakl, sonli tekshiruv, geometriya, talqin va eksport bosqichlaridan o‘ting. Har bir bosqich natijani baholash uchun zarur ma’lumotni ko‘rsatadi.",
    workflowKicker: "Ishlash usuli", workflowTitle: "Masaladan qayta ishlatiladigan natijagacha aniq yo‘l.", workflowCopy: "Jarayon masala, usul va dalilni birga saqlaydi. Kengaytirilgan tahlil asosiy natijaga xalaqit bermagan holda mavjud bo‘ladi.",
    ecosystemKicker: "Tadqiqot uzluksizligi", ecosystemTitle: "Natija hisoblashdan keyin ham ishlatiladi.", ecosystemCopy: "Math Loyihadagi bitta asbobdir. Natijani bir marta saqlang, Notebookda tahlil qiling va o‘sha Scientific Objectdan hisoblashni qayta bajarmasdan Writerda foydalaning.",
    finalTitle: ["Matematik natija", "tekshiriladigan"], finalCopy: "Aniq hisoblash, sonli tekshiruv, vizualizatsiya va tuzilmali ilmiy chiqish uchun fokuslangan laboratoriyadan foydalaning.",
  },
} as const;

function SurfacePreview() {
  return (
    <svg viewBox="0 0 720 420" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="math-premium-surface" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e4f4ff" />
          <stop offset="0.48" stopColor="#8dbff0" />
          <stop offset="1" stopColor="#766bd8" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="#c8d7e8" strokeWidth="1" opacity="0.42">
        <path d="M78 340H650" /><path d="M110 365L560 74" /><path d="M138 374V52" />
      </g>
      <path d="M118 302 C175 287 209 207 276 174 C346 139 389 222 448 223 C509 224 554 144 620 160 L620 320 C557 311 513 281 458 279 C390 276 353 330 286 336 C219 342 165 319 118 322Z" fill="url(#math-premium-surface)" opacity="0.73" />
      <g fill="none" stroke="#2f6aaa" strokeWidth="1" opacity="0.48">
        <path d="M119 301 C180 286 211 207 276 175 C343 142 391 221 447 222 C509 224 554 145 619 161" />
        <path d="M121 313 C181 302 216 231 280 201 C343 172 390 239 447 242 C503 245 549 178 616 184" />
        <path d="M129 323 C187 316 222 253 284 226 C343 201 390 255 444 259 C499 263 541 209 605 211" />
        <path d="M145 331 C199 326 230 276 288 252 C343 230 389 270 441 276 C491 282 529 237 589 238" />
      </g>
      <g fill="#5677a8" fontFamily="Georgia, serif" fontStyle="italic" opacity="0.6">
        <text x="490" y="80" fontSize="20">z = f(x,y)</text><text x="92" y="92" fontSize="18">∇²f</text><text x="575" y="356" fontSize="15">x</text>
      </g>
    </svg>
  );
}

export default function HomePage() {
  const { locale } = useLocale();
  const copy = mathLandingCopy[locale];
  const preview = locale === "uz"
    ? { figure: "01-rasm · Integral studiyasi", compute: "Mahalliy hisoblash", problem: "Masala", items: ["Masala", "Vizualizatsiya", "Natija", "Talqin", "Kengaytirilgan tahlil"], footer: ["Avval aniq shakl", "Sonli tekshiruv", "Tuzilmali chiqish"], visual: "Asosiy vizualizatsiya", surface: "Sirt talqini", interactive: "Interaktiv", exact: "Aniq natija", exactCopy: "Ramziy shakl asosiy bo‘lib qoladi; sonli hisoblash tekshiruv qatlami sifatida ishlaydi.", interpretation: "Talqin", interpretationCopy: "Integral gamma funksiyasiga bevosita mos keladi. Farazlar, usul va natija keyingi foydalanish uchun mavjud.", saved: "Loyihaga saqlandi" }
    : { figure: "Fig 01 · Integral Studio", compute: "Local compute", problem: "Problem", items: ["Problem", "Visualization", "Result", "Interpretation", "Advanced analysis"], footer: ["Exact first", "Numeric verification", "Structured output"], visual: "Primary visualization", surface: "Surface interpretation", interactive: "Interactive", exact: "Exact result", exactCopy: "The symbolic form stays primary; numerical evaluation remains a verification layer.", interpretation: "Interpretation", interpretationCopy: "The integral maps directly to the gamma function. Assumptions, method and result remain available for later use.", saved: "Saved to Project" };
  const promises = locale === "uz" ? [["Yeching", "Aniq ramziy usullar, sonli tekshiruvlar va ochiq farazlardan foydalaning."], ["Vizuallashtiring", "2D, 3D va animatsion ilmiy chiqishni natijaning bir qismi sifatida tekshiring."], ["Saqlang", "Natijani tuzilmali, qayta ishlab bo‘ladigan va Loyiha uchun mavjud holatda saqlang."]] : defaultPromises;
  const workflow = locale === "uz" ? [["01", "Masala", "Matematik savolni farazlar va chegaralar bilan bir marta kiriting."], ["02", "Ko‘rsating", "Natijani songa yoki ifodaga qisqartirishdan oldin geometriyani ko‘rinadigan qiling."], ["03", "Yeching", "Avval aniq shaklni oling, keyin uni tekshirish yoki kengaytirish uchun sonli usullardan foydalaning."], ["04", "Talqin qiling", "Keltirib chiqarish, diagnostika va ma’noni asosiy natija yonida saqlang."], ["05", "Saqlang", "Ilmiy obyektni Notebook va Writer davom ettira oladigan qilib saqlang."]] : defaultWorkflow;
  return (
    <div className="ax-landing">
      <div className="ax-landing-container">
        <section className="ax-landing-hero">
          <div className="ax-hero-copy">
            <p className="ax-landing-kicker">{copy.kicker}</p>
            <h1 className="ax-landing-display">{copy.title[0]}<br />{copy.title[1]} <span className="italic">{copy.title[2]}</span></h1>
            <div className="ax-signature-rule" aria-hidden="true" />
            <p className="ax-landing-lead">{copy.lead}</p>
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <Link href="/laboratory" className="ax-premium-primary">{copy.open} <ArrowRight className="h-4 w-4" /></Link>
              <Link href="#product" className="ax-premium-secondary">{copy.explore} <ArrowRight className="h-3.5 w-3.5 text-[var(--ax-text-faint)]" /></Link>
            </div>
          </div>
          <div className="ax-hero-visual"><AnimatedMathSurface /></div>
        </section>
      </div>

      <section className="ax-promise-strip">
        <div className="ax-landing-container ax-promise-grid">
          {promises.map(([title, copy]) => <div key={title} className="ax-promise-item"><div className="ax-promise-title">{title}</div><p className="ax-promise-copy">{copy}</p></div>)}
        </div>
      </section>

      <section id="product" className="ax-landing-section">
        <div className="ax-landing-container">
          <div className="ax-section-head">
            <div><p className="ax-landing-kicker">{copy.productKicker}</p><h2 className="ax-section-title">{copy.productTitle}</h2></div>
            <p className="ax-section-copy">{copy.productCopy}</p>
          </div>

          <div className="ax-product-frame">
            <div className="flex h-11 items-center justify-between border-b border-[var(--ax-line)] px-5"><span className="ax-figure-label">{preview.figure}</span><span className="text-[10px] font-semibold text-[var(--ax-accent)]">{preview.compute}</span></div>
            <div className="grid min-h-[560px] lg:grid-cols-[220px_minmax(0,1fr)]">
              <aside className="border-b border-[var(--ax-line)] bg-[var(--ax-surface-soft)] p-5 lg:border-b-0 lg:border-r lg:p-6">
                <div className="ax-figure-label">{preview.problem}</div>
                <div className="mt-4 rounded-[10px] border border-[var(--ax-line)] bg-white p-4 font-serif text-[21px]">∫₀∞ x²e⁻ˣ dx</div>
                <div className="mt-8 space-y-1.5 text-[11px] font-semibold text-[var(--ax-text-soft)]">{preview.items.map((item,index)=><div key={item} className={`rounded-[7px] px-3 py-2.5 ${index===2?'bg-white text-[var(--ax-text)] shadow-[var(--ax-shadow-subtle)]':''}`}>{item}</div>)}</div>
                <div className="mt-9 border-t border-[var(--ax-line)] pt-5 text-[10px] leading-5 text-[var(--ax-text-faint)]">{preview.footer.map((item) => <span key={item} className="block">{item}</span>)}</div>
              </aside>
              <div className="grid min-w-0 xl:grid-cols-[1.18fr_.82fr]">
                <div className="min-h-[410px] border-b border-[var(--ax-line)] p-6 sm:p-8 xl:border-b-0 xl:border-r">
                  <div className="flex items-center justify-between"><div><div className="ax-figure-label">{preview.visual}</div><div className="mt-1 text-sm font-semibold">{preview.surface}</div></div><span className="text-[10px] font-semibold text-[var(--ax-accent)]">{preview.interactive}</span></div>
                  <div className="mt-4 h-[390px]"><SurfacePreview /></div>
                </div>
                <div className="grid content-start gap-0">
                  <div className="border-b border-[var(--ax-line)] p-6 sm:p-8"><div className="ax-figure-label">{preview.exact}</div><div className="mt-5 font-serif text-[34px] tracking-[-.04em]">Γ(3) = 2</div><p className="mt-3 text-[12px] leading-6 text-[var(--ax-text-soft)]">{preview.exactCopy}</p></div>
                  <div className="p-6 sm:p-8"><div className="ax-figure-label">{preview.interpretation}</div><p className="mt-4 text-[13px] leading-7 text-[var(--ax-text-soft)]">{preview.interpretationCopy}</p><div className="mt-6 flex flex-wrap gap-2 text-[10px]"><span className="rounded-full bg-[var(--ax-accent-soft)] px-3 py-1.5 font-semibold text-[var(--ax-accent)]">{locale === "uz" ? "Aniq" : "Exact"}</span><span className="rounded-full bg-[var(--ax-surface-soft)] px-3 py-1.5 font-semibold">{preview.saved}</span></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="ax-landing-section ax-landing-section-alt">
        <div className="ax-landing-container">
          <div className="ax-section-head"><div><p className="ax-landing-kicker">{copy.workflowKicker}</p><h2 className="ax-section-title">{copy.workflowTitle}</h2></div><p className="ax-section-copy">{copy.workflowCopy}</p></div>
          <div className="ax-editorial-list">{workflow.map(([index,title,copy])=><div key={index} className="ax-editorial-row"><div className="ax-editorial-index">{index}</div><div className="ax-editorial-title">{title}</div><p className="ax-editorial-copy">{copy}</p></div>)}</div>
        </div>
      </section>

      <section id="ecosystem" className="ax-landing-section ax-landing-section-alt">
        <div className="ax-landing-container">
          <div className="ax-section-head"><div><p className="ax-landing-kicker">{copy.ecosystemKicker}</p><h2 className="ax-section-title">{copy.ecosystemTitle}</h2></div><p className="ax-section-copy">{copy.ecosystemCopy}</p></div>
          <div className="mt-14 grid gap-3 lg:grid-cols-3">
            {[{icon:Sigma,title:'Math',copy:'Solve, visualize and save the scientific result.'},{icon:BookOpenText,title:'Notebook',copy:'Keep reasoning and observations attached to the evidence.'},{icon:FileDown,title:'Writer',copy:'Turn the result into a publication without rebuilding context.'}].map(({icon:Icon,title,copy},index)=><div key={title} className="relative border-t border-[var(--ax-line)] py-7 lg:px-7 lg:first:pl-0"><div className="flex items-center gap-3"><Icon className="h-4 w-4 text-[var(--ax-accent)]"/><span className="font-serif text-[25px]">{title}</span></div><p className="mt-3 max-w-sm text-[13px] leading-6 text-[var(--ax-text-soft)]">{copy}</p>{index<2?<ArrowRight className="absolute right-2 top-9 hidden h-4 w-4 text-[var(--ax-text-faint)] lg:block"/>:null}</div>)}
          </div>
        </div>
      </section>

      <section className="ax-final-cta"><div className="ax-landing-container"><h2 className="ax-final-title">{copy.finalTitle[0]} <span className="italic">{copy.finalTitle[1]}</span></h2><p className="ax-final-copy">{copy.finalCopy}</p><Link href="/laboratory" className="ax-premium-primary mt-8">{copy.open} <ArrowRight className="h-4 w-4" /></Link></div></section>
    </div>
  );
}
