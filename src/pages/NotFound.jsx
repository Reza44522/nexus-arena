import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageWrapper from '../components/ui/PageWrapper';
import NeonButton from '../components/ui/NeonButton';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <PageWrapper>
      <div className="grid min-h-[60vh] place-items-center px-4 text-center">
        <div>
          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-gradient font-display text-8xl font-black"
          >
            404
          </motion.h1>
          <p className="mt-4 font-display uppercase tracking-[0.3em] text-slate-300">Sector not found</p>
          <p className="mt-2 text-slate-500">The page you're looking for respawned somewhere else.</p>
          <NeonButton className="mt-8" onClick={() => navigate('/')}>Back to Base</NeonButton>
        </div>
      </div>
    </PageWrapper>
  );
}