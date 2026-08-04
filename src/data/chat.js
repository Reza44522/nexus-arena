const minsAgo = (m) => new Date(Date.now() - m * 60000);

export const initialMessages = [
  { id: 1, name: 'NovaStrike', color: 'text-fuchsia-300', avatar: 'from-fuchsia-500 to-purple-600', role: 'mod', text: 'Welcome to the NexusArena stream! Keep it friendly and have fun 🔥', time: minsAgo(6) },
  { id: 2, name: 'PhantomX', color: 'text-emerald-300', avatar: 'from-emerald-400 to-teal-600', role: 'user', text: 'that last clutch was INSANE 😱', time: minsAgo(5) },
  { id: 3, name: 'LunaByte', color: 'text-violet-300', avatar: 'from-violet-500 to-indigo-600', role: 'vip', text: 'predicting a clean 3-0 sweep tonight ⚡', time: minsAgo(4) },
  { id: 4, name: 'ZeroDay', color: 'text-amber-300', avatar: 'from-amber-400 to-orange-500', role: 'user', text: 'anyone else lagging or just my connection 💀', time: minsAgo(2) },
  { id: 5, name: 'VortexQueen', color: 'text-rose-300', avatar: 'from-rose-500 to-fuchsia-600', role: 'user', text: 'stream is crispy on my end, 1080p60 easy', time: minsAgo(1) },
];

export const botPool = [
  { name: 'IronVeil', color: 'text-slate-300', avatar: 'from-slate-500 to-slate-700', role: 'user', text: "LET'S GOOO 🚀" },
  { name: 'LunaByte', color: 'text-violet-300', avatar: 'from-violet-500 to-indigo-600', role: 'vip', text: 'that flick aim is unreal 🎯' },
  { name: 'GhostLine', color: 'text-cyan-300', avatar: 'from-cyan-500 to-blue-600', role: 'user', text: 'first time here, this arena is sick!' },
  { name: 'NovaStrike', color: 'text-fuchsia-300', avatar: 'from-fuchsia-500 to-purple-600', role: 'mod', text: 'reminder: no spoilers for the finals 🙏' },
  { name: 'PhantomX', color: 'text-emerald-300', avatar: 'from-emerald-400 to-teal-600', role: 'user', text: 'clip it! someone clip it 😂' },
  { name: 'BitHunter', color: 'text-amber-300', avatar: 'from-amber-400 to-orange-500', role: 'user', text: 'GG incoming, calling it now' },
  { name: 'VortexQueen', color: 'text-rose-300', avatar: 'from-rose-500 to-fuchsia-600', role: 'user', text: 'the rotation speed this round 👀' },
  { name: 'ZeroDay', color: 'text-amber-300', avatar: 'from-amber-400 to-orange-500', role: 'user', text: 'chat moving too fast — are we winning? 🏆' },
];