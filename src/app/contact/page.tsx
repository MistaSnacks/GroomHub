import { Metadata } from 'next';
import { ContactContent } from '@/components/contact-content';

export const metadata: Metadata = {
    title: 'Contact Us',
    description: 'Have a question about GroomLocal or need help with your listing? Reach out to our team — we\'re here to help pet parents and groomers across the PNW.',
};

export default function ContactPage() {
    return <ContactContent />;
}
