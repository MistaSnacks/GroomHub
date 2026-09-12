import { MarketingBody } from "@/components/marketing-body";
import { getMarketingPage, marketingMetadata } from "@/lib/cms/marketing";
import { SnackboxOverlay } from "@/lib/cms/Overlay";
import { Metadata } from 'next';
import { AboutContent } from '@/components/about-content';
import { getCities, getTotalListingCount } from '@/lib/supabase/queries';

const fallbackMetadata: Metadata = {
    title: 'About Us',
    description: 'GroomLocal is the Pacific Northwest\'s trusted pet grooming directory. Connecting pet parents with verified groomers across Washington and Oregon.',
    alternates: { canonical: '/about' },
    openGraph: {
        title: 'About GroomLocal',
        description: 'The Pacific Northwest\'s trusted pet grooming directory. Connecting pet parents with verified groomers across Washington and Oregon.',
        type: 'website',
        url: '/about',
        siteName: 'GroomLocal',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'About GroomLocal' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'About GroomLocal',
        description: 'The Pacific Northwest\'s trusted pet grooming directory. Connecting pet parents with verified groomers across Washington and Oregon.',
        images: ['/og-image.png'],
    },
};

export async function generateMetadata() {return marketingMetadata(await getMarketingPage("about"),fallbackMetadata);}

export default async function AboutPage() {
    const [cities, totalGroomers, copy] = await Promise.all([
        getCities(),
        getTotalListingCount(),
        getMarketingPage("about"),
    ]);

    const statesCovered = new Set(cities.map((city) => city.state_abbr)).size;

    return (
        <>
        {copy?._id && <SnackboxOverlay documents={[{docId:copy._id,title:"About"}]} />}
        <AboutContent copy={copy}
            metrics={{
                totalGroomers,
                citiesCovered: cities.length,
                statesCovered,
            }}
        />
        <MarketingBody copy={copy} />
        </>
    );
}
