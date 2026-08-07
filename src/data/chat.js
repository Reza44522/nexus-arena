const minsAgo = (m) => new Date(Date.now() - m * 60000);

export const initialMessages = [
  { id: 1, name: 'NovaStrike', color: 'text-fuchsia-300', avatar: 'from-fuchsia-500 to-purple-600', role: 'mod', text: 'به استریم خوش آمدید! 🔥', time: minsAgo(6) },
  { id: 2, name: 'PhantomX', color: 'text-emerald-300', avatar: 'from-emerald-400 to-teal-600', role: 'user', text: 'اون حرکت آخر خیلی باحال بود 😱', time: minsAgo(5) },
  { id: 3, name: 'LunaByte', color: 'text-violet-300', avatar: 'from-violet-500 to-indigo-600', role: 'vip', text: 'پیش‌بینی ۳-۰ تمیز! ⚡', time: minsAgo(4) },
  { id: 4, name: 'ZeroDay', color: 'text-amber-300', avatar: 'from-amber-400 to-orange-500', role: 'user', text: 'فقط من لگ دارم یا همه؟ 💀', time: minsAgo(2) },
  { id: 5, name: 'VortexQueen', color: 'text-rose-300', avatar: 'from-rose-500 to-fuchsia-600', role: 'user', text: 'برای من عالیه، 1080p60', time: minsAgo(1) },
];

export const botPool = [
  { name: 'IronVeil', color: 'text-slate-300', avatar: 'from-slate-500 to-slate-700', role: 'user', text: 'بریمmmm 🚀' },
  { name: 'LunaByte', color: 'text-violet-300', avatar: 'from-violet-500 to-indigo-600', role: 'vip', text: 'اِیمِش عالیه 🎯' },
  { name: 'GhostLine', color: 'text-cyan-300', avatar: 'from-cyan-500 to-blue-600', role: 'user', text: 'اولین بارمه، خیلی باحاله!' },
  { name: 'NovaStrike', color: 'text-fuchsia-300', avatar: 'from-fuchsia-500 to-purple-600', role: 'mod', text: 'یادآوری: اسپویل نکنید لطفاً 🙏' },
  { name: 'PhantomX', color: 'text-emerald-300', avatar: 'from-emerald-400 to-teal-600', role: 'user', text: 'کلیپش کنید! 😂' },
  { name: 'BitHunter', color: 'text-amber-300', avatar: 'from-amber-400 to-orange-500', role: 'user', text: 'GG الان میاد' },
  { name: 'VortexQueen', color: 'text-rose-300', avatar: 'from-rose-500 to-fuchsia-600', role: 'user', text: 'چرخش این راند 👀' },
  { name: 'ZeroDay', color: 'text-amber-300', avatar: 'from-amber-400 to-orange-500', role: 'user', text: 'چت خیلی سریعه — داریم می‌بریم؟ 🏆' },
];