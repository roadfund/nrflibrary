import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about The National Road Fund Research Library.',
};

const FAQ_SECTIONS = [
  {
    heading: 'Accounts and subscriptions',
    items: [
      {
        question: 'Who can create an account?',
        answer:
          'Students, researchers, and institutions. Select the account type that matches you when you sign up; institutions are verified by Road Fund staff before their subscription activates.',
      },
      {
        question: 'What happens if my subscription lapses?',
        answer:
          'You keep your account, but full details, previews, and downloads are locked until your subscription is renewed. Items you previously downloaded remain listed in your download history.',
      },
      {
        question: 'Can I switch plans?',
        answer:
          'Yes. Change your plan from the billing page. The new plan and price take effect at the start of your next billing period.',
      },
    ],
  },
  {
    heading: 'Access and content',
    items: [
      {
        question: "Why can't I download a publication I can see in the catalogue?",
        answer:
          'Some publications are plan-restricted or require reviewer approval before download. Sign in and open the publication for a specific explanation of what is required.',
      },
      {
        question: 'How do access requests work?',
        answer:
          'Open a publication marked "Request required," submit your research purpose, institution, and intended use, and a reviewer will approve, decline, or ask for more information.',
      },
    ],
  },
  {
    heading: 'Institutions',
    items: [
      {
        question: 'How does billing work for institutions?',
        answer:
          'Institution plans are billed by seat count to the institution, not to individual members. The institution administrator manages billing, invoices, and member seats from the institution dashboard.',
      },
      {
        question: 'How do I invite colleagues to our institution account?',
        answer:
          'From the institution dashboard, go to Member management and invite by email. Invitees accept the invitation and get access under the institution subscription.',
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="Frequently asked questions" />
      <div className="mt-8 flex flex-col gap-10">
        {FAQ_SECTIONS.map((section) => (
          <div key={section.heading}>
            <h2 className="text-foreground font-serif text-lg font-semibold">{section.heading}</h2>
            <Accordion className="mt-3">
              {section.items.map((item) => (
                <AccordionItem key={item.question} value={item.question}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </div>
  );
}
