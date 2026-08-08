import { motion } from 'framer-motion';
import { MessageCircle, UserPlus, Flag, Ban } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NeonButton from '../ui/NeonButton';

export default function UserCard({ user, onChat, onAdd, onReport, onBlock, relation }) {
  const { user: me } = useAuth();
  const isMe = user.id === me?.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass flex items-center gap-4 rounded-2xl p-4"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 font-bold text-slate-950">
        {user.username.slice(0, 2).toUpperCase()}
      </div>
      
      <div className="min-w-0 flex-1">
        <p className="truncate font-display font-bold text-white">
          {user.username}
          {isMe && <span className="mr-2 text-xs text-cyan-400">(خودم)</span>}
        </p>
        <p className="text-xs text-slate-400">
          سطح {user.level || 1} • {user.xp || 0} XP
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* چت - فقط برای دوستان accepted */}
        {relation === 'friend' && !isMe && (
          <NeonButton size="sm" variant="ghost" onClick={() => onChat(user)}>
            <MessageCircle size={14} className="ml-1 inline" />
            چت
          </NeonButton>
        )}

        {/* اضافه کردن دوست */}
        {!relation && !isMe && (
          <NeonButton size="sm" onClick={() => onAdd(user)}>
            <UserPlus size={14} className="ml-1 inline" />
            اضافه
          </NeonButton>
        )}

        {relation === 'sent' && (
          <span className="rounded-lg bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-300">
            ⏳ در انتظار
          </span>
        )}

        {relation === 'received' && (
          <>
            <NeonButton size="sm" onClick={() => onAdd(user, 'accept')}>
              ✓ قبول
            </NeonButton>
            <NeonButton size="sm" variant="ghost" onClick={() => onAdd(user, 'reject')}>
              ✗ رد
            </NeonButton>
          </>
        )}

        {/* گزارش و بلاک - فقط برای غیر خودم */}
        {!isMe && (relation === 'friend' || !relation) && (
          <div className="flex gap-1">
            <button
              onClick={() => onReport(user)}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-amber-400/10 hover:text-amber-300"
              title="گزارش"
            >
              <Flag size={14} />
            </button>
            <button
              onClick={() => onBlock(user)}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-300"
              title="بلاک"
            >
              <Ban size={14} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}