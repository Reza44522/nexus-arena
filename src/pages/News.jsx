import { useState } from 'react';
import { motion } from 'framer-motion';
import PageWrapper from '../components/ui/PageWrapper';
import SectionTitle from '../components/ui/SectionTitle';
import Badge from '../components/ui/Badge';
import { newsArticles, newsCategories } from '../data/news';
import { cn } from '../utils/cn';

export default function News() {
  const [selectedCategory, setSelectedCategory] = useState('همه');

  const filteredNews =
    selectedCategory === 'همه'
      ? newsArticles
      : newsArticles.filter((n) => n.category === selectedCategory);

  return (
    <PageWrapper>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionTitle
          center
          tag="📰 اخبار"
          title="آخرین اخبار نکسوس"
          subtitle="از آپدیت‌ها، مسابقات و رویدادهای ویژه باخبر شو"
        />

        {/* فیلتر دسته‌بندی */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {newsCategories.map((cat) => (
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

        {/* اخبار */}
        <motion.div layout className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNews.map((article, i) => (
            <motion.article
              key={article.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass group overflow-hidden rounded-2xl transition-all duration-300 hover:border-cyan-400/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]"
            >
              <div className={cn('relative flex h-32 items-center justify-center bg-gradient-to-br', article.gradient)}>
                <span className="text-5xl drop-shadow-lg transition-transform duration-500 group-hover:scale-125">
                  {article.icon}
                </span>
                <div className="absolute right-3 top-3">
                  <Badge color="cyan">{article.category}</Badge>
                </div>
              </div>
              <div className="space-y-3 p-5">
                <p className="text-xs text-slate-500">{article.date}</p>
                <h3 className="font-display text-lg font-bold text-white transition-colors group-hover:text-cyan-300">
                  {article.title}
                </h3>
                <p className="text-sm text-slate-400">{article.excerpt}</p>
                <button className="text-sm font-semibold text-cyan-300 transition-colors hover:text-cyan-200">
                  ادامه‌ی مطلب ←
                </button>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </PageWrapper>
  );
}