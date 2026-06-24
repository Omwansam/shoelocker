/**
 * Canonical legal copy for Terms, Privacy, and Accessibility.
 * Rendered on dedicated pages — always available even if the API is offline.
 */

/** @typedef {{ title: string, paragraphs: string[], bullets?: string[] }} LegalSection */

/** @typedef {{ title: string, lastUpdated: string, intro: string, sections: LegalSection[] }} LegalDocument */

/** @type {Record<'terms' | 'privacy' | 'accessibility', LegalDocument>} */
export const legalDocuments = {
  terms: {
    title: 'Terms of use',
    lastUpdated: '24 June 2026',
    intro:
      'These Terms of Use govern your access to and use of the ShoeLocker website, mobile experiences, and related services operated in Kenya. By browsing, registering, or placing an order, you agree to these terms.',
    sections: [
      {
        title: '1. About ShoeLocker',
        paragraphs: [
          'ShoeLocker ("we", "us", "our") is a Kenya-based retailer of performance and lifestyle footwear and apparel. We operate this online store, physical mall branches, and member programmes such as Kickback Rewards.',
          'Product names, logos, and images belong to their respective brand owners. We are an authorised or legitimate reseller and do not claim ownership of third-party trademarks displayed on this site.',
        ],
      },
      {
        title: '2. Eligibility & accounts',
        paragraphs: [
          'You must be at least 18 years old, or have consent from a parent or guardian, to create an account or complete a purchase. You are responsible for keeping your login credentials confidential and for all activity under your account.',
          'Information you provide at checkout must be accurate — especially your name, delivery address, county, and phone number (+254 format) used for M-Pesa and courier contact.',
        ],
        bullets: [
          'One account per individual unless we approve a business account in writing.',
          'We may suspend accounts involved in fraud, chargebacks, or abuse of promotions.',
          'You may sign out at any time; signing out on a shared device ends your session on that device.',
        ],
      },
      {
        title: '3. Products, pricing & availability',
        paragraphs: [
          'All prices are displayed in Kenyan Shillings (KES) unless stated otherwise. Prices include applicable VAT where required. Shipping fees, if any, are shown at checkout before you confirm payment.',
          'Product availability is live from our catalog system. If an item sells out while you are checking out, we will notify you and will not charge you for unavailable lines.',
          'We may correct pricing errors before dispatch. If you were charged incorrectly, we will refund the difference or cancel the order with a full refund.',
        ],
        bullets: [
          'Colours and materials may vary slightly from photography due to screen settings and manufacturer runs.',
          'Release dates for limited drops are estimates; courier timelines apply after handoff from our warehouse.',
        ],
      },
      {
        title: '4. Orders & payment',
        paragraphs: [
          'Placing an order is an offer to purchase. We accept your order when we send confirmation and begin processing. We may refuse or cancel orders at our discretion (e.g. suspected fraud, stock error, or policy violation).',
          'Accepted payment methods include M-Pesa STK Push (where enabled), pay on delivery (where offered), and other methods shown at checkout. M-Pesa payments must be completed on the phone number you provide.',
        ],
        bullets: [
          'You authorise us to charge the order total shown at checkout, including discounts and shipping.',
          'Failed or abandoned M-Pesa prompts do not complete your order until payment is confirmed.',
          'Promotional codes are subject to published rules and cannot be combined unless stated.',
        ],
      },
      {
        title: '5. Delivery & pickup',
        paragraphs: [
          'Delivery timelines shown on our Shipping page are estimates from courier handoff, not from the moment you click "Pay". Remote counties may take longer than Nairobi metro.',
          'Store pickup is available at participating branches listed in our Store Locator. Bring your order reference and a valid national ID or passport for verification.',
          'Risk of loss passes to you upon delivery to your address or upon verified pickup at a store.',
        ],
      },
      {
        title: '6. Returns & exchanges',
        paragraphs: [
          'Our Returns & Exchanges policy (published on shoelocker.ke/returns) forms part of these terms. Unworn items in original packaging may be eligible for exchange or refund within the windows stated there.',
          'Refunds for eligible returns are processed to the original payment method where possible; M-Pesa refunds follow Safaricom and our processor timelines.',
        ],
      },
      {
        title: '7. Acceptable use',
        paragraphs: [
          'You agree not to misuse the site: no scraping at scale, no attempting to breach security, no fraudulent chargebacks, no reselling limited releases in violation of launch rules, and no harassment of staff or other customers.',
          'We may restrict access, cancel orders, or pursue remedies if we detect abuse.',
        ],
      },
      {
        title: '8. Intellectual property',
        paragraphs: [
          'Site design, copy, photography produced by ShoeLocker, and our logos are protected. You may not copy, frame, or mirror our site without written permission.',
          'Brand trademarks remain the property of Nike, adidas, and other respective owners.',
        ],
      },
      {
        title: '9. Limitation of liability',
        paragraphs: [
          'To the fullest extent permitted by Kenyan law, ShoeLocker is not liable for indirect, incidental, or consequential damages arising from use of the site or products, except where liability cannot be excluded by law.',
          'Our total liability for any claim relating to an order is limited to the amount you paid for that order.',
        ],
      },
      {
        title: '10. Changes & governing law',
        paragraphs: [
          'We may update these terms. Material changes will be posted on this page with an updated date. Continued use after changes constitutes acceptance.',
          'These terms are governed by the laws of Kenya. Disputes shall be subject to the exclusive jurisdiction of Kenyan courts, without prejudice to your statutory consumer rights.',
        ],
        bullets: [
          'Questions: hello@shoelocker.ke',
          'Registered operations: Nairobi, Kenya',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    lastUpdated: '24 June 2026',
    intro:
      'This Privacy Policy explains how ShoeLocker collects, uses, stores, and protects personal information when you use our website, stores, and member programmes. We process data in line with applicable Kenyan law and good industry practice.',
    sections: [
      {
        title: '1. Who we are',
        paragraphs: [
          'ShoeLocker is the data controller for personal information collected through this website and associated checkout, account, and marketing flows.',
          'Contact our privacy team at hello@shoelocker.ke for data requests.',
        ],
      },
      {
        title: '2. Information we collect',
        paragraphs: [
          'We collect information you provide directly and data generated when you use our services.',
        ],
        bullets: [
          'Account & profile: name, email, phone number, password (stored hashed), saved addresses.',
          'Orders: delivery address, county, city, items purchased, sizes, payment method, M-Pesa transaction references.',
          'Communications: support emails, newsletter sign-ups, survey responses.',
          'Technical: device type, browser, IP address, cookies, and analytics events used to improve the site.',
          'In-store: pickup verification ID details as required by law and fraud prevention.',
        ],
      },
      {
        title: '3. How we use your information',
        paragraphs: [
          'We use personal data to operate the business and fulfil your requests.',
        ],
        bullets: [
          'Process and deliver orders; send order confirmations and status updates.',
          'Authenticate accounts and prevent fraud or abuse.',
          'Operate Kickback Rewards — points, tiers, and member offers.',
          'Respond to support enquiries and improve our catalog and UX.',
          'Send marketing email when you subscribe; you may unsubscribe at any time.',
          'Comply with legal obligations, tax, and accounting requirements.',
        ],
      },
      {
        title: '4. Legal bases',
        paragraphs: [
          'We rely on: (a) contract — to fulfil orders you place; (b) consent — for marketing and optional cookies where required; (c) legitimate interests — security, analytics, and service improvement balanced against your rights; (d) legal obligation — records we must keep.',
        ],
      },
      {
        title: '5. Sharing & processors',
        paragraphs: [
          'We do not sell your personal information. We share data only with trusted parties who help us run the store:',
        ],
        bullets: [
          'Payment providers (e.g. Safaricom M-Pesa) to process payments you initiate.',
          'Courier and logistics partners to deliver orders within Kenya.',
          'Cloud hosting and email providers that store data under contractual safeguards.',
          'Professional advisers or authorities when required by law.',
        ],
      },
      {
        title: '6. International transfers',
        paragraphs: [
          'Our primary systems are operated with a Kenya-first posture. If data is processed outside Kenya, we ensure appropriate safeguards consistent with applicable law.',
        ],
      },
      {
        title: '7. Retention',
        paragraphs: [
          'We keep order and payment records for as long as needed for tax, accounting, and dispute resolution — typically up to seven years unless a longer period is required by law.',
          'Marketing preferences are kept until you unsubscribe or ask us to delete them.',
          'Account data is retained while your account is active and for a reasonable period after closure.',
        ],
      },
      {
        title: '8. Security',
        paragraphs: [
          'We use industry-standard measures: HTTPS encryption in transit, hashed passwords, access controls, and monitored infrastructure. No method of transmission over the internet is 100% secure; please use a strong unique password.',
          'Sign out on shared devices. Report suspected account compromise to hello@shoelocker.ke immediately.',
        ],
      },
      {
        title: '9. Your rights',
        paragraphs: [
          'Subject to applicable law, you may request access, correction, deletion, restriction, or portability of your personal data, and object to certain processing.',
          'To exercise rights, email hello@shoelocker.ke with enough detail to verify your identity. We respond within a reasonable timeframe.',
          'You may lodge a complaint with the Office of the Data Protection Commissioner (Kenya) if you believe your rights have been violated.',
        ],
      },
      {
        title: '10. Cookies & analytics',
        paragraphs: [
          'We use cookies and similar technologies for session management, cart persistence, and aggregated analytics. You can control cookies through your browser settings; disabling some cookies may affect checkout.',
        ],
      },
      {
        title: '11. Children',
        paragraphs: [
          'Our services are not directed at children under 13. We do not knowingly collect data from children without parental consent. Contact us if you believe we have collected a child\'s data in error.',
        ],
      },
      {
        title: '12. Changes',
        paragraphs: [
          'We may update this policy. The "Last updated" date at the top will change when we do. Material changes may also be communicated by email or site notice where appropriate.',
        ],
      },
    ],
  },
  accessibility: {
    title: 'Accessibility statement',
    lastUpdated: '24 June 2026',
    intro:
      'ShoeLocker is committed to making our digital storefront usable by as many people as possible, including customers who use assistive technologies. This statement describes our current approach and how to get help.',
    sections: [
      {
        title: '1. Our commitment',
        paragraphs: [
          'We aim to align with Web Content Accessibility Guidelines (WCAG) 2.1 Level AA where practicable. Accessibility is an ongoing effort — we test key flows with keyboard navigation, screen readers, and responsive layouts.',
        ],
      },
      {
        title: '2. Measures we have implemented',
        bullets: [
          'Skip link to main content on every page.',
          'Visible keyboard focus indicators on interactive controls.',
          'Semantic HTML landmarks (header, main, footer, navigation).',
          'Form labels and error messages associated with inputs.',
          'Sufficient colour contrast on primary text and buttons.',
          'Responsive layouts that reflow on mobile without horizontal scrolling for core tasks.',
          'Alt text on meaningful product and promotional images.',
          'Dialog components (cart drawer, modals) that trap focus appropriately.',
          'Reduced-motion respect for users with prefers-reduced-motion enabled.',
        ],
      },
      {
        title: '3. Known limitations',
        paragraphs: [
          'Some third-party content (e.g. embedded social feeds or payment provider overlays) may not fully meet our standards. Legacy PDFs, if published, may not be fully tagged.',
          'We are working to improve product image zoom descriptions and size-selector announcements on all breakpoints.',
        ],
      },
      {
        title: '4. Physical stores',
        paragraphs: [
          'Selected mall locations offer step-free access via mall infrastructure. Staff can assist with pickup orders at the counter. Contact a branch ahead if you need additional accommodation.',
        ],
      },
      {
        title: '5. Feedback & assistance',
        paragraphs: [
          'If you encounter a barrier on our site or need help completing a purchase, contact us:',
        ],
        bullets: [
          'Email: hello@shoelocker.ke — subject line "Accessibility"',
          'Phone: use the number listed on our Store Locator for your nearest branch',
          'We aim to respond within two Nairobi business days',
        ],
      },
      {
        title: '6. Compatibility',
        paragraphs: [
          'Our site is tested with recent versions of Chrome, Firefox, Safari, and Edge on desktop and mobile, alongside VoiceOver and NVDA where available.',
        ],
      },
      {
        title: '7. Continuous improvement',
        paragraphs: [
          'Accessibility is reviewed when we ship major redesigns or new checkout features. We welcome reports from customers and advocacy groups — they help us prioritise fixes.',
        ],
      },
    ],
  },
};

/** @param {'terms' | 'privacy' | 'accessibility'} slug */
export function isLegalDocumentSlug(slug) {
  return slug in legalDocuments;
}

/** Flatten structured legal doc to plain text for API seeding */
export function legalDocumentToPlainText(doc) {
  const parts = [doc.intro, ''];
  for (const section of doc.sections) {
    parts.push(section.title);
    parts.push(...section.paragraphs);
    if (section.bullets?.length) {
      parts.push(...section.bullets.map((b) => `• ${b}`));
    }
    parts.push('');
  }
  return parts.join('\n').trim();
}
