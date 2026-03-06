import { Metadata } from 'next';
import { AboutContent } from '@/components/about-content';
import { getCities, getTotalListingCount } from '@/lib/supabase/queries';

export const metadata: Metadata = {
    title: 'About Us',
    description: 'GroomLocal is the Pacific Northwest\'s trusted pet grooming directory — connecting pet parents with verified groomers across Washington and Oregon.',
    openGraph: {
        title: 'About GroomLocal',
        description: 'The Pacific Northwest\'s trusted pet grooming directory — connecting pet parents with verified groomers across Washington and Oregon.',
        type: 'website',
        url: '/about',
        siteName: 'GroomLocal',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'About GroomLocal' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'About GroomLocal',
        images: ['/og-image.png'],
    },
};

export default async function AboutPage() {
    const [cities, totalGroomers] = await Promise.all([
        getCities(),
        getTotalListingCount(),
    ]);

    const statesCovered = new Set(cities.map((city) => city.state_abbr)).size;

    return (
        <AboutContent
            metrics={{
                totalGroomers,
                citiesCovered: cities.length,
                statesCovered,
            }}
        />
    );
}
