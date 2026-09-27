import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'What is COOPER Complex Hub?',
      answer: 'COOPER Complex Hub is an institutional-grade financial technology platform enabling verified individuals and institutions to monitor and access structured crypto and forex investment strategies with transparent account management and risk controls.'
    },
    {
      question: 'Why does the platform state "DEMO MODE"?',
      answer: 'In compliance with strict financial regulations, COOPER Complex Hub operates in DEMO mode until all 12 mandatory legal, regulatory, custody, and banking configurations are fully verified. In DEMO mode, transactions, trades, and payouts are simulated safely without risking real capital.'
    },
    {
      question: 'Does COOPER Complex Hub guarantee investment profits?',
      answer: 'No. Never. Financial markets involve genuine risk of capital loss. Past performance does not guarantee future results. COOPER Complex Hub strictly forbids guaranteed profit promises or artificial returns.'
    },
    {
      question: 'What payment methods can I use to fund my account?',
      answer: 'The platform integrates MTN Mobile Money, Airtel Money, Bank Wire Transfer (Stanbic / Standard Chartered corporate escrow), and Visa and Mastercard payments. All payments are verified on the backend prior to ledger crediting.'
    },
    {
      question: 'Why is KYC identity verification mandatory?',
      answer: 'To prevent financial crime, money laundering, and fraud, every participant must complete identity verification (National ID, Passport, or Driver’s License) and address verification before initiating investment allocations or withdrawals.'
    },
    {
      question: 'How does the referral program work?',
      answer: 'Our referral program is a transparent single-tier marketing commission. It does NOT operate as a multi-level marketing (MLM) or pyramid recruitment tree. Referral commissions are paid from corporate marketing budgets and never taken from new investors\' principal deposits.'
    },
    {
      question: 'How are balances calculated?',
      answer: 'Balances are calculated strictly from an immutable double-entry financial ledger. Frontend clients can never dictate balances; all figures represent verified credits and debits recorded in the database.'
    }
  ];

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', maxWidth: '840px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Questions & Answers
        </span>
        <h1 style={{ fontSize: '2.8rem', marginTop: '8px', marginBottom: '16px' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
          Key information about platform operations, regulatory posture, and account mechanics.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div 
              key={idx} 
              className="card"
              style={{ padding: '20px 24px', cursor: 'pointer', transition: 'all 0.2s ease', borderColor: isOpen ? 'var(--accent-primary)' : undefined }}
              onClick={() => setOpenIndex(isOpen ? null : idx)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: isOpen ? '#38bdf8' : 'var(--text-primary)' }}>
                  {faq.question}
                </h3>
                <div style={{ color: 'var(--text-muted)' }}>
                  {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {isOpen && (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.7' }}>
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
