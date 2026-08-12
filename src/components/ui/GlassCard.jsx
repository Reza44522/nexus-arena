import { cn } from '../../utils/cn';

/* ─────────── GlassCard — NEXUS UI v6 ───────────
   سطح شیشه‌ای چندلایه با لبه‌ی طیفی و نویز سینمایی
   - className و همه‌ی propهای اضافی (onClick و...) از طریق ...rest حفظ می‌شوند
   - propهای اختیاری جدید: glow (هاله نئونی) و vip (حاشیه طلایی چرخان)
─────────────────────────────────────────────── */
export default function GlassCard({ className, children, glow = false, vip = false, ...rest }) {
  return (
    <div
      className={cn(
        'glass relative rounded-2xl',
        glow && 'glass-glow',
        vip && 'card-vip',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}