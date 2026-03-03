import { Metadata } from 'next';
import { AboutContent } from '@/components/about-content';

export const metadata: Metadata = {
    title: 'About Us | GroomLocal Directory',
    description: 'Learn more about GroomLocal, your trusted guide to the pawfect groomer in the PNW.',
};

export default function AboutPage() {
    return <AboutContent />;
}
