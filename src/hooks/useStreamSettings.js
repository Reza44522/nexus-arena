import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useStreamSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('stream_settings')
        .select('*')
        .eq('id', 1)
        .single();
      setSettings(data);
      setLoading(false);
    };
    load();

    // Real-Time: تغییرات ادمین فوراً به همه می‌رسد
    const channel = supabase
      .channel('stream-settings')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'stream_settings',
      }, (payload) => {
        setSettings(payload.new);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // فقط ادمین می‌تواند آپدیت کند
  const updateSettings = async (updates) => {
    const { data, error } = await supabase
      .from('stream_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();
    
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  };

  return { settings, loading, updateSettings };
}