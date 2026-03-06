import { Metadata } from 'next';
import { ContactContent } from '@/components/contact-content';

export const metadata: Metadata = {
    title: 'Contact Us',
    description: 'Have a question about GroomLocal or need help with your listing? Reach out to our team — we\'re here to help pet parents and groomers across the PNW.',
    openGraph: {
        title: 'Contact GroomLocal',
        description: 'Have a question about GroomLocal or need help with your listing? Reach out to our team.',
        type: 'website',
        url: '/contact',
        siteName: 'GroomLocal',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Contact GroomLocal' }],
    },
    twitter: { card: 'summary_large_image', images: ['/og-image.png'] },
};

export default function ContactPage() {
    return <ContactContent />;
}
