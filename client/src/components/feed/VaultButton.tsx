'use client';

import { useState, useCallback } from 'react';
import { Archive } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import styles from './VaultButton.module.css';

interface VaultButtonProps {
  entryId: string;
  vaulted: boolean;
  onVaultChange?: (vaulted: boolean) => void;
}

const VaultButton = ({ entryId, vaulted: initialVaulted, onVaultChange }: VaultButtonProps) => {
  const user = useAuthStore((state) => state.user);
  const [vaulted, setVaulted] = useState(initialVaulted);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleVault = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (!user) {
        // Show login prompt
        return;
      }

      setIsUpdating(true);
      const newVaultStatus = !vaulted;
      setVaulted(newVaultStatus);

      try {
        await api.post(`/reflections/${entryId}/vault`);
        if (onVaultChange) {
          onVaultChange(newVaultStatus);
        }
      } catch (error) {
        // Revert on error
        setVaulted(!newVaultStatus);
        console.error('Failed to toggle vault', error);
      } finally {
        setIsUpdating(false);
      }
    },
    [entryId, user, vaulted, onVaultChange],
  );

  return (
    <button
      className={`${styles.vaultButton} ${vaulted ? styles.vaulted : ''} ${
        isUpdating ? styles.updating : ''
      }`}
      onClick={handleVault}
      disabled={!user || isUpdating}
      title={vaulted ? 'Remove from vault' : 'Add to vault'}
    >
      <Archive size={18} />
      <span>{vaulted ? 'Vaulted ✓' : 'Vault it'}</span>
    </button>
  );
};

export default VaultButton;
