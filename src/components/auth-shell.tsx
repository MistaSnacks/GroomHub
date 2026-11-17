import Image from "next/image";

/** Field and button styles shared by the sign in, sign up and reset password forms. */
export const AUTH_LABEL = "mb-1.5 block text-sm font-semibold text-brand-primary";
export const AUTH_INPUT =
  "w-full rounded-xl border-[1.5px] border-[#B9C4CE] bg-white px-4 py-3 text-base text-brand-primary outline-none transition-colors placeholder:text-slate-400 focus:border-[#0F766E] focus:ring-2 focus:ring-brand-secondary/35";
export const AUTH_BUTTON =
  "flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-accent px-6 py-3.5 text-base font-bold text-brand-primary transition-colors hover:bg-fun-pop disabled:cursor-not-allowed disabled:opacity-50";
export const AUTH_LINK = "font-semibold text-[#0F766E] underline underline-offset-2 transition-colors hover:text-brand-primary";
export const AUTH_ERROR = "rounded-xl border border-[#F48FB1] bg-[#FCE4EC] p-3 text-sm text-[#C2185B]";
export const AUTH_SUCCESS = "rounded-xl border border-[#A5D6A7] bg-[#E8F5E9] p-3 text-sm text-[#2E7D32]";

/** A red star after the label of a required field. Screen readers get the `required` attribute of the input. */
export function Required() {
  return <span aria-hidden="true" className="ml-0.5 text-[#C4452E]">*</span>;
}

/**
 * The account pages: Maui on a pale teal panel, the form on a white panel.
 * The panels start under the site header, which is transparent at the top (see `.auth-split` in globals.css).
 */
export function AuthShell({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <div className="auth-split -mt-[72px] flex flex-1 flex-col bg-white lg:grid lg:min-h-[max(42rem,100dvh)] lg:grid-cols-[5fr_7fr]">
      <aside className="paws-teal flex items-center gap-4 bg-[#E3F8F5] px-5 pb-5 pt-[88px] sm:px-8 lg:flex-col lg:justify-center lg:gap-8 lg:px-10 lg:pb-16 lg:pt-[104px]">
        <div className="maui-pop maui-wiggle w-24 shrink-0 sm:w-28 lg:w-[min(24rem,78%)]">
          <Image
            src="/maui-assets/00-maui-main.png?v=maui-20260904-alpha1"
            alt="Maui waving hello"
            width={480}
            height={480}
            sizes="(min-width: 1024px) 384px, 112px"
            priority
            className="aspect-square w-full select-none object-contain"
          />
        </div>
        <p className="max-w-sm text-base font-medium leading-snug text-brand-primary/80 lg:text-center lg:text-xl">
          Your listing, your photos and your hours in one place.
        </p>
      </aside>

      <section className="flex flex-1 items-start justify-center px-5 pb-12 pt-9 sm:px-8 lg:items-center lg:pb-16 lg:pt-[104px]">
        <div className="w-full max-w-md lg:max-w-lg">
          <h1 className="font-heading text-4xl font-bold text-brand-primary mb-2">{title}</h1>
          <p className="text-lg text-slate-600 mb-8">{lead}</p>
          {children}
        </div>
      </section>
    </div>
  );
}
