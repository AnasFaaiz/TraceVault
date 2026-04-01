'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from '@/styles/profile.module.css';
import api from '@/lib/api';
import { Loader2, AlertCircle, CheckCircle, Shield, Globe, Camera } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import AppLayout from '@/components/dashboard/AppLayout';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, token, setAuth } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    avatarUrl: '',
    isPrivate: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    if (user) {
      const u = user as typeof user & { bio?: string; avatarUrl?: string; isPrivate?: boolean };
      setFormData({
        name: u.name || '',
        username: u.username || '',
        bio: u.bio || '',
        avatarUrl: u.avatarUrl || '',
        isPrivate: u.isPrivate || false,
      });
      setLoading(false);
    }
  }, [user]);

  // Debounce username check
  useEffect(() => {
    if (!formData.username) {
      setIsUsernameAvailable(null);
      return;
    }
    
    if (formData.username === user?.username) {
      setIsUsernameAvailable(true);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const resp = await api.get(`/users/check-username/${formData.username}`);
        setIsUsernameAvailable(resp.data.available);
      } catch {
        setIsUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.username, user?.username]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const resp = await api.post('/users/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newAvatarUrl = resp.data.avatarUrl;
      setFormData((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
      
      if (user && token) {
        setAuth({ ...user, avatarUrl: newAvatarUrl }, token);
      }
      setMessage({ type: 'success', text: 'Avatar updated!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload avatar' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await api.patch('/users/me', formData);
      if (user && token) {
        setAuth({ ...user, ...response.data }, token);
      }
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      setTimeout(() => {
        router.push(`/u/${formData.username}`);
      }, 1500);
    } catch (err: unknown) {
      setMessage({ type: 'error', text: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const isInvalid = !formData.name || !formData.username || isUsernameAvailable === false;
  const u = user as typeof user & { bio?: string; avatarUrl?: string; isPrivate?: boolean };
  const hasChanges = u && (
    formData.name !== u.name ||
    formData.username !== u.username ||
    formData.bio !== (u.bio || '') ||
    formData.avatarUrl !== (u.avatarUrl || '') ||
    formData.isPrivate !== (u.isPrivate || false)
  );

  if (loading) {
    return (
      <AppLayout title="Settings" subtitle="Manage your profile">
        <div style={{ height: '70vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
          <Loader2 className="animate-spin" size={32} color="var(--amber)" />
          <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.05em' }}>PREPARING WORKSPACE...</p>
        </div>
      </AppLayout>
    );
  }

  const headerActions = (
    <button 
      type="button" 
      onClick={() => router.push(`/u/${user?.username}`)}
      style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border)', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', color: 'var(--ink)' }}
    >
      View Profile
    </button>
  );

  return (
    <AppLayout title="Settings" subtitle="Edit Profile" headerActions={headerActions}>
      <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        
        {/* Floating Toast Notification */}
        {message && (
          <div style={{
            position: 'fixed',
            bottom: '40px',
            right: '40px',
            padding: '14px 24px',
            borderRadius: '16px',
            background: 'var(--ink)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            zIndex: 1000,
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.1)',
            animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {message.type === 'success' ? <CheckCircle size={18} color="#10b981" /> : <AlertCircle size={18} color="#ef4444" />}
            {message.type === 'success' ? 'saved successfully' : message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Section: Avatar */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', padding: '32px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => document.getElementById('avatar-upload')?.click()}>
              <div style={{ width: '100px', height: '100px', borderRadius: '32px', background: 'linear-gradient(135deg, #f5f2eb 0%, #ece8df 100%)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)', fontSize: '32px', overflow: 'hidden', position: 'relative' }}>
                {formData.avatarUrl ? (
                  <Image width={100} height={100} src={formData.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user?.name?.charAt(0)
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.3)', padding: '4px', display: 'flex', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                  <Camera size={14} color="#fff" />
                </div>
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 className="animate-spin" size={24} color="var(--amber)" />
                  </div>
                )}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px', fontFamily: 'var(--serif)' }}>Profile Picture</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>This will be displayed on your header and sidebar.</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="file" id="avatar-upload" hidden onChange={handleAvatarChange} accept="image/*" />
                <button 
                  type="button" 
                  className={styles.p_btn} 
                  style={{ fontSize: '13px', padding: '10px 18px', background: 'var(--amber)', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={uploading}
                >
                  Change Photo
                </button>
                {formData.avatarUrl && (
                  <button 
                    type="button" 
                    className={styles.p_btn} 
                    style={{ fontSize: '13px', padding: '10px 18px', background: 'transparent', border: '1px solid #fee2e2', color: '#dc2626', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => setFormData({...formData, avatarUrl: ''})}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section: Basic Info */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', padding: '32px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '8px', fontFamily: 'var(--serif)' }}>Personal Identity</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>Display Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#fff', fontSize: '14px', outline: 'none', transition: 'all 0.2s' }}
                  placeholder="Your display name"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>Username</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '14px' }}>@</span>
                  <input 
                    type="text" 
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                    style={{ padding: '14px 16px 14px 32px', borderRadius: '12px', border: `1px solid ${isUsernameAvailable === false ? '#ef4444' : isUsernameAvailable === true ? '#22c55e' : 'var(--border)'}`, background: '#fff', fontSize: '14px', width: '100%', outline: 'none' }}
                    placeholder="username"
                    required
                  />
                  <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                    {checkingUsername ? <Loader2 className="animate-spin" size={14} color="var(--muted)" /> : isUsernameAvailable === true ? <CheckCircle size={14} color="#22c55e" /> : isUsernameAvailable === false ? <AlertCircle size={14} color="#ef4444" /> : null}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>Bio</label>
              <textarea 
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#fff', fontSize: '14px', minHeight: '120px', resize: 'vertical', outline: 'none', lineHeight: 1.6 }}
                placeholder="Software Engineer finding signal in the noise."
              />
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border)', padding: '32px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px', fontFamily: 'var(--serif)' }}>Privacy Configuration</h3>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '24px', 
                borderRadius: '16px', 
                background: formData.isPrivate ? 'rgba(139, 62, 42, 0.03)' : 'rgba(42, 107, 94, 0.03)', 
                cursor: 'pointer', 
                border: `1px solid ${formData.isPrivate ? 'var(--rust)33' : 'var(--teal)33'}`, 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onClick={() => setFormData({...formData, isPrivate: !formData.isPrivate})}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: formData.isPrivate ? 'rgba(139, 62, 42, 0.1)' : 'rgba(42, 107, 94, 0.1)', flexShrink: 0 }}>
                  {formData.isPrivate ? <Shield size={24} color="var(--rust)" /> : <Globe size={24} color="var(--teal)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: formData.isPrivate ? 'var(--rust)' : 'var(--teal)' }}>
                    {formData.isPrivate ? 'Private Repository' : 'Public Explorer'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                    {formData.isPrivate 
                      ? 'Your profile is hidden from the community feed.' 
                      : `Viewable by everyone at /u/${formData.username || 'username'}`}
                  </div>
                </div>
              </div>
              <div style={{ width: '52px', height: '28px', borderRadius: '99px', background: formData.isPrivate ? 'var(--rust)' : 'var(--border)', position: 'relative', transition: 'background 0.3s' }}>
                 <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: formData.isPrivate ? '27px' : '3px', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', paddingBottom: '60px' }}>
            <button 
              type="button" 
              style={{ padding: '14px 28px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '11px', textTransform: 'uppercase' }}
              onClick={() => router.back()}
            >
              Discard
            </button>
            <button 
              type="submit" 
              disabled={saving || isInvalid || !hasChanges}
              style={{ padding: '14px 40px', background: 'var(--ink)', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 600, opacity: (saving || isInvalid || !hasChanges) ? 0.5 : 1, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', cursor: 'pointer' }}
            >
              {saving ? 'SEALING...' : 'SAVE CHANGES'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
