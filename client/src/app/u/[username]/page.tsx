import React from 'react';
import { Metadata } from 'next';
import ProfileClient from './ProfileClient';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/users/${username}/profile`);
    const data = await response.json();
    const { identity, stats } = data;
    
    return {
      title: `${identity.displayName} (@${identity.username}) | TraceVault Engineering Profile`,
      description: identity.bio || `Engineering footprint of ${identity.displayName}. ${stats.totalEntries} entries sealed across ${stats.totalProjects} projects.`,
      openGraph: {
        title: `${identity.displayName}'s Engineering Profile`,
        description: identity.bio || `Explore ${identity.displayName}'s debugging journey on TraceVault.`,
        images: identity.avatarUrl ? [identity.avatarUrl] : [],
      },
    };
  } catch {
    return {
      title: 'Engineering Profile | TraceVault',
    };
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <ProfileClient username={username} />;
}
