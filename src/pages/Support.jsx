import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/ui/PageWrapper';
import SectionTitle from '../components/ui/SectionTitle';
import NeonButton from '../components/ui/NeonButton';
import { faqs } from '../data/faq';
import { cn } from '../utils/cn';

function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <motion.div
      layout
      className="glass overflow-hidden rounded-xl transition-all duration-300"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-display text-sm font-bold text-white">{faq.question}</span>
        <motion.span
          animate={isOpen ? { rotate: 180 } : { rotate: 0 }}
          className="text-cyan-300"
        >
          ▼
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="border-t border-white/10 px-5 py-4 text-sm text-slate-300">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Support() {
  const [openId, setOpenId] = useState(null);

  return (
    <PageWrapper>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionTitle
          center
          tag="❓ پشتیبانی"
          title="سوالات متداول"
          subtitle="پاسخ سوالات رایج را اینجا پیدا کنید"
        />

        {/* سوالات متداول */}
        <div className="space-y-3">
          {faqs.map((faq) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              isOpen={openId === faq.id}
              onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
            />
          ))}
        </div>

        {/* فرم تماس */}
        <div className="mt-12">
          <SectionTitle tag="📩 تماس" title="با ما در ارتباط باشید" />
          <form className="glass-glow space-y-5 rounded-2xl p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-display text-xs uppercase tracking-wider text-slate-400">
                  نام شما
                </label>
                <input
                  type="text"
                  placeholder="نام خود را وارد کنید"
                  className="glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-display text-xs uppercase tracking-wider text-slate-400">
                  ایمیل
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  className="glass w-full rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block font-display text-xs uppercase tracking-wider text-slate-400">
                پیام شما
              </label>
              <textarea
                rows={5}
                placeholder="پیام خود را بنویسید..."
                className="glass w-full resize-none rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
              />
            </div>
            <NeonButton type="submit" className="w-full">
              ارسال پیام
            </NeonButton>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}