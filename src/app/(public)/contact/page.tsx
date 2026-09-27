import type { Metadata } from 'next';
import { Mail, MapPin, Phone } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { ContactForm } from '@/components/shared/contact-form';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact the National Road Fund of Liberia Research Hub team.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Contact"
        description="Questions about your account, a publication, or an institutional agreement."
      />
      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <ContactForm />
        <div className="border-border text-foreground flex flex-col gap-5 border-t pt-6 text-sm lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          <div className="flex items-start gap-3">
            <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">National Road Fund of Liberia</p>
              <p className="text-muted-foreground">Tubman Boulevard, Sinkor, Monrovia, Liberia</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Research Hub support</p>
              <p className="text-muted-foreground">info@nrf.gov.lr</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Office hours</p>
              <p className="text-muted-foreground">+231 77 000 0000, Monday–Friday, 9:00–17:00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
