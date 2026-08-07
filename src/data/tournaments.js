export const tournaments = [
  { id: 1, title: 'جام بزرگ Cyber Vanguard', game: 'Cyber Vanguard', prize: '۵۰۰ میلیون تومان', players: 128, status: 'در حال ثبت‌نام', startTime: '۱۴۰۴/۰۶/۱۵', icon: '🏆', gradient: 'from-amber-400 to-orange-500', featured: true },
  { id: 2, title: 'مسابقات سرعتی Neon Drift', game: 'Neon Drift Racers', prize: '۱۲۰ میلیون تومان', players: 64, status: 'در حال برگزاری', startTime: 'الان', icon: '🏎️', gradient: 'from-fuchsia-500 to-purple-600', featured: true },
  { id: 3, title: 'چالش بقا Quantum Clash', game: 'Quantum Clash', prize: '۸۰ میلیون تومان', players: 256, status: 'در حال ثبت‌نام', startTime: '۱۴۰۴/۰۶/۲۰', icon: '⚔️', gradient: 'from-cyan-400 to-blue-600', featured: false },
  { id: 4, title: 'لیگ حرفه‌ای Shadow Protocol', game: 'Shadow Protocol', prize: '۲۰۰ میلیون تومان', players: 32, status: 'به‌زودی', startTime: '۱۴۰۴/۰۷/۰۱', icon: '🥷', gradient: 'from-slate-500 to-emerald-600', featured: false },
  { id: 5, title: 'تورنومنت آرکید Arcane', game: 'Arcane Realms', prize: '۱۵۰ میلیون تومان', players: 96, status: 'در حال ثبت‌نام', startTime: '۱۴۰۴/۰۶/۲۵', icon: '🧙', gradient: 'from-violet-500 to-purple-600', featured: true },
  { id: 6, title: 'مسابقات تیمی Starfall', game: 'Starfall Odyssey', prize: '۳۰۰ میلیون تومان', players: 48, status: 'در حال ثبت‌نام', startTime: '۱۴۰۴/۰۷/۰۵', icon: '🚀', gradient: 'from-indigo-400 to-cyan-500', featured: false },
];

export const tournamentStatusColors = {
  'در حال ثبت‌نام': 'cyan',
  'در حال برگزاری': 'green',
  'به‌زودی': 'amber',
  'پایان یافته': 'slate',
};