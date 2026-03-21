import React, { useState, useEffect } from 'react';
import { EditProfile } from './EditProfile';
import { apiService } from '../services/apiService';
import { Language, UserRole } from '../types';
import { Edit2 } from 'lucide-react';

export const ProfileWithEdit = ({ lang, role, user, onLogout }: any) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProfile, setCurrentProfile] = useState({
    name: '',
    phone: '',
    bio: '',
    avatar_url: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await apiService.getUserProfile();
      setCurrentProfile({
        name: profile.profile?.name || '',
        phone: profile.profile?.phone || '',
        bio: profile.profile?.bio || '',
        avatar_url: profile.profile?.avatar_url || ''
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleEditSuccess = (updatedUser: any) => {
    console.log('Profile updated successfully:', updatedUser);
    loadProfile();
  };

  return (
    <div>
      <button onClick={() => setShowEditModal(true)}>
        <Edit2 className="h-5 w-5" />
      </button>

      <EditProfile
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        currentProfile={currentProfile}
        lang={lang}
      />
    </div>
  );
};
