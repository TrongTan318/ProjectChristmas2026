import { Snowfall } from '@/components/effects/Snowfall';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { getSiteSettings, requireActiveContest } from '@/server/contest';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const contest = await requireActiveContest();
  const settings = await getSiteSettings(contest.id);
  return (
    <>
      <a
        href="#noi-dung"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded focus:bg-gold focus:px-4 focus:py-2 focus:text-ink"
      >
        Bỏ qua đến nội dung
      </a>
      <SiteHeader title={contest.name} />
      <main id="noi-dung">{children}</main>
      <SiteFooter settings={settings} organizer={contest.organizer} />
      <Snowfall enabled={settings.effectsEnabled} />
    </>
  );
}
