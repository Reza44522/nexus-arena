import { useState } from 'react';
import { motion } from 'framer-motion';
import PageWrapper from '../components/ui/PageWrapper';
import SectionTitle from '../components/ui/SectionTitle';
import Badge from '../components/ui/Badge';
import NeonButton from '../components/ui/NeonButton';
import { storeItems, storeCategories } from '../data/store';
import { cn } from '../utils/cn';

export default function Store() {
  const [selectedCategory, setSelectedCategory] = useState('همه');

  const filteredItems =
    selectedCategory === 'همه'
      ? storeItems
      : storeItems.filter((item) => item.category === selectedCategory);

  return (
    <PageWrapper>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionTitle
          center
          tag="🛒 فروشگاه"
          title="فروشگاه نکسوس"
          subtitle="بهترین بازی‌ها، اسکین‌ها و آیتم‌ها با تخفیف‌های ویژه"
        />

        {/* بنر ویژه */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-glow relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-violet-500/10 p-8 text-center md:p-12"
        >
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-[100px]" />
          <h2 className="font-display text-3xl font-black text-white md:text-4xl">
            🔥 حراج <span className="text-gradient">۵۰٪ تخفیف</span> ویژه‌ی تابستانه
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            تا ۵۰٪ تخفیف روی بازی‌ها و آیتم‌های منتخب — فقط تا پایان هفته!
          </p>
          <NeonButton className="mt-6">مشاهده‌ی تخفیف‌ها</NeonButton>
        </motion.div>

        {/* فیلتر دسته‌بندی */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {storeCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'glass rounded-full px-4 py-2 font-display text-xs font-bold uppercase tracking-wider transition-all duration-300',
                selectedCategory === cat
                  ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                  : 'text-slate-400 hover:border-white/20 hover:text-white'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* آیتم‌ها */}
        <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredItems.map((item, i) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass group overflow-hidden rounded-2xl transition-all duration-300 hover:border-cyan-400/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
            >
              <div className={cn('relative flex h-32 items-center justify-center bg-gradient-to-br', item.gradient)}>
                <span className="text-5xl drop-shadow-lg transition-transform duration-500 group-hover:scale-125">
                  {item.icon}
                </span>
                {item.discount > 0 && (
                  <span className="absolute right-3 top-3 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                    {item.discount}٪ تخفیف
                  </span>
                )}
                {item.featured && (
                  <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2 py-1 text-xs font-bold text-slate-900">
                    ⭐ ویژه
                  </span>
                )}
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <h3 className="font-display text-sm font-bold text-white transition-colors group-hover:text-cyan-300">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400">{item.category}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-lg font-bold text-cyan-300">
                      {item.price.toLocaleString()} <span className="text-xs">تومان</span>
                    </p>
                    {item.oldPrice && (
                      <p className="text-xs text-slate-500 line-through">{item.oldPrice.toLocaleString()}</p>
                    )}
                  </div>
                  <NeonButton size="sm">خرید</NeonButton>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </PageWrapper>
  );
}