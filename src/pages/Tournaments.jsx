import { motion } from 'framer-motion';
import PageWrapper from '../components/ui/PageWrapper';
import SectionTitle from '../components/ui/SectionTitle';
import Badge from '../components/ui/Badge';
import NeonButton from '../components/ui/NeonButton';
import { tournaments, tournamentStatusColors } from '../data/tournaments';
import { cn } from '../utils/cn';

export default function Tournaments() {
  return (
    <PageWrapper>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionTitle
          center
          tag="🏆 مسابقات"
          title="تورنومنت‌های فعال"
          subtitle="در مسابقات شرکت کن و جوایز میلیونی ببر!"
        />

        {/* تورنومنت‌های ویژه */}
        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          {tournaments
            .filter((t) => t.featured)
            .map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-glow relative overflow-hidden rounded-3xl p-6"
              >
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-10', t.gradient)} />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{t.icon}</span>
                      <div>
                        <h3 className="font-display text-xl font-bold text-white">{t.title}</h3>
                        <p className="text-sm text-slate-400">{t.game}</p>
                      </div>
                    </div>
                    <Badge color={tournamentStatusColors[t.status]}>{t.status}</Badge>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="glass rounded-xl p-3 text-center">
                      <p className="font-display text-lg font-bold text-cyan-300">{t.players}</p>
                      <p className="text-xs text-slate-400">بازیکن</p>
                    </div>
                    <div className="glass rounded-xl p-3 text-center">
                      <p className="font-display text-lg font-bold text-amber-300">{t.prize}</p>
                      <p className="text-xs text-slate-400">جایزه</p>
                    </div>
                    <div className="glass rounded-xl p-3 text-center">
                      <p className="font-display text-lg font-bold text-fuchsia-300">{t.startTime}</p>
                      <p className="text-xs text-slate-400">شروع</p>
                    </div>
                  </div>
                  <NeonButton className="mt-6 w-full">ثبت‌نام در تورنومنت</NeonButton>
                </div>
              </motion.div>
            ))}
        </div>

        {/* همه‌ی تورنومنت‌ها */}
        <SectionTitle tag="📋 لیست کامل" title="همه‌ی مسابقات" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass group rounded-2xl p-5 transition-all duration-300 hover:border-cyan-400/30 hover:shadow-[0_0_25px_rgba(34,211,238,0.15)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{t.icon}</span>
                  <div>
                    <h4 className="font-display text-sm font-bold text-white">{t.title}</h4>
                    <p className="text-xs text-slate-400">{t.game}</p>
                  </div>
                </div>
                <Badge color={tournamentStatusColors[t.status]}>{t.status}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-amber-300">{t.prize}</span>
                <span className="text-xs text-slate-400">👥 {t.players} بازیکن</span>
              </div>
              <NeonButton size="sm" variant="ghost" className="mt-4 w-full">
                مشاهده‌ی جزئیات
              </NeonButton>
            </motion.div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}