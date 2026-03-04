import { Metadata } from 'next';
import { AboutContent } from '@/components/about-content';
import { getCities, getTotalListingCount } from '@/lib/supabase/queries';

export const metadata: Metadata = {
    title: 'About Us',
    description: 'GroomLocal is the Pacific Northwest\'s trusted pet grooming directory — connecting pet parents with verified groomers across Washington and Oregon.',
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
