import { Metadata } from 'next';
import { ContactContent } from '@/components/contact-content';

export const metadata: Metadata = {
    title: 'Contact Us | GroomLocal Directory',
    description: 'Get in touch with GroomLocal support. We\'d love to hear from you!',
};

export default function ContactPage() {
    return <ContactContent />;
}
