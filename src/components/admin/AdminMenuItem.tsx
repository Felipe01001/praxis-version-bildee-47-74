import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * AdminMenuItem - Component that only shows for admin users
 * Can be used in navigation menus to show admin-only links
 */
const AdminMenuItem: React.FC = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        setIsAdmin(profile?.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <Link
      to="/admin"
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <Shield className="h-4 w-4" />
      Administração
    </Link>
  );
};

export default AdminMenuItem;