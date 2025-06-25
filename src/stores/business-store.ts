import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface BusinessDocument {
  id: string;
  type: 'gst_certificate' | 'terms_conditions' | 'other';
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface BusinessProfile {
  id: string;
  legalName: string;
  website: string;
  email: string;
  phoneNumbers: string[];
  registeredAddress: string;
  gstNumber: string;
  countryOfIncorporation: string;
  industry: string;
  numberOfEmployees: string;
  description: string;
  logo?: string;
  documents: BusinessDocument[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  businessId: string;
  userId?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  role: 'SuperAdmin' | 'Admin' | 'User';
  status: 'active' | 'invited' | 'removed';
  invitedAt?: Date;
  joinedAt?: Date;
  removedAt?: Date;
  invitedBy: string;
  avatar?: string;
}

export interface CreateTeamMemberDto {
  fullName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  role: 'SuperAdmin' | 'Admin' | 'User';
}

export interface BusinessOnboardingData {
  // Step 1: Company Information
  legalName: string;
  website: string;
  email: string;
  phoneNumbers: string[];
  registeredAddress: string;
  
  // Step 2: Business Details
  gstNumber: string;
  countryOfIncorporation: string;
  industry: string;
  numberOfEmployees: string;
  description: string;
  
  // Step 3: Documents
  documents: File[];
}

export interface BusinessState {
  // State
  business: BusinessProfile | null;
  teamMembers: TeamMember[];
  isLoading: boolean;
  error: string | null;
  onboardingStep: number;
  onboardingData: Partial<BusinessOnboardingData>;
  
  // Business Actions
  loadBusiness: () => Promise<void>;
  updateBusiness: (data: Partial<BusinessProfile>) => Promise<void>;
  completeBusinessOnboarding: (data: BusinessOnboardingData) => Promise<void>;
  uploadDocument: (file: File, type: BusinessDocument['type']) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  
  // Team Actions
  loadTeamMembers: () => Promise<void>;
  addTeamMember: (member: CreateTeamMemberDto) => Promise<void>;
  updateTeamMember: (memberId: string, data: Partial<TeamMember>) => Promise<void>;
  removeTeamMember: (memberId: string) => Promise<void>;
  resendInvitation: (memberId: string) => Promise<void>;
  
  // Onboarding Actions
  setOnboardingStep: (step: number) => void;
  updateOnboardingData: (data: Partial<BusinessOnboardingData>) => void;
  clearOnboardingData: () => void;
  
  // Utility Actions
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useBusinessStore = create<BusinessState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        business: null,
        teamMembers: [],
        isLoading: false,
        error: null,
        onboardingStep: 1,
        onboardingData: {},

        // Load Business Action
        loadBusiness: async () => {
          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const response = await fetch('/api/business', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              }
            });

            if (!response.ok) {
              throw new Error('Failed to load business profile');
            }

            const business = await response.json();
            
            set({ 
              business: {
                ...business,
                createdAt: new Date(business.createdAt),
                updatedAt: new Date(business.updatedAt),
                documents: business.documents.map((doc: any) => ({
                  ...doc,
                  uploadedAt: new Date(doc.uploadedAt)
                }))
              }, 
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load business profile', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Update Business Action
        updateBusiness: async (data: Partial<BusinessProfile>) => {
          const { business } = get();
          if (!business) throw new Error('No business profile found');

          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const response = await fetch(`/api/business/${business.id}`, {
              method: 'PATCH',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              },
              body: JSON.stringify(data),
            });

            if (!response.ok) {
              throw new Error('Failed to update business profile');
            }

            const updatedBusiness = await response.json();
            
            set({ 
              business: {
                ...updatedBusiness,
                createdAt: new Date(updatedBusiness.createdAt),
                updatedAt: new Date(updatedBusiness.updatedAt)
              }, 
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update business profile', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Complete Business Onboarding Action
        completeBusinessOnboarding: async (data: BusinessOnboardingData) => {
          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const formData = new FormData();
            
            // Add business data
            Object.entries(data).forEach(([key, value]) => {
              if (key === 'documents') {
                value.forEach((file: File) => {
                  formData.append('documents', file);
                });
              } else if (Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
              } else {
                formData.append(key, value);
              }
            });

            const response = await fetch('/api/business/onboarding', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              },
              body: formData,
            });

            if (!response.ok) {
              throw new Error('Failed to complete business onboarding');
            }

            const business = await response.json();
            
            set({ 
              business: {
                ...business,
                createdAt: new Date(business.createdAt),
                updatedAt: new Date(business.updatedAt)
              }, 
              isLoading: false,
              onboardingData: {}
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to complete business onboarding', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Upload Document Action
        uploadDocument: async (file: File, type: BusinessDocument['type']) => {
          const { business } = get();
          if (!business) throw new Error('No business profile found');

          set({ isLoading: true, error: null });
          
          try {
            const formData = new FormData();
            formData.append('document', file);
            formData.append('type', type);

            // TODO: Replace with actual API call
            const response = await fetch(`/api/business/${business.id}/documents`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              },
              body: formData,
            });

            if (!response.ok) {
              throw new Error('Failed to upload document');
            }

            const document = await response.json();
            
            set(state => ({ 
              business: state.business ? {
                ...state.business,
                documents: [...state.business.documents, {
                  ...document,
                  uploadedAt: new Date(document.uploadedAt)
                }]
              } : null,
              isLoading: false 
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to upload document', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Delete Document Action
        deleteDocument: async (documentId: string) => {
          const { business } = get();
          if (!business) throw new Error('No business profile found');

          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const response = await fetch(`/api/business/${business.id}/documents/${documentId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              }
            });

            if (!response.ok) {
              throw new Error('Failed to delete document');
            }
            
            set(state => ({ 
              business: state.business ? {
                ...state.business,
                documents: state.business.documents.filter(doc => doc.id !== documentId)
              } : null,
              isLoading: false 
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete document', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Load Team Members Action
        loadTeamMembers: async () => {
          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const response = await fetch('/api/team', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              }
            });

            if (!response.ok) {
              throw new Error('Failed to load team members');
            }

            const teamMembers = await response.json();
            
            set({ 
              teamMembers: teamMembers.map((member: any) => ({
                ...member,
                invitedAt: member.invitedAt ? new Date(member.invitedAt) : undefined,
                joinedAt: member.joinedAt ? new Date(member.joinedAt) : undefined,
                removedAt: member.removedAt ? new Date(member.removedAt) : undefined
              })), 
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load team members', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Add Team Member Action
        addTeamMember: async (member: CreateTeamMemberDto) => {
          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const response = await fetch('/api/team', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              },
              body: JSON.stringify(member),
            });

            if (!response.ok) {
              throw new Error('Failed to invite team member');
            }

            const newMember = await response.json();
            
            set(state => ({ 
              teamMembers: [...state.teamMembers, {
                ...newMember,
                invitedAt: new Date(newMember.invitedAt)
              }], 
              isLoading: false 
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to invite team member', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Update Team Member Action
        updateTeamMember: async (memberId: string, data: Partial<TeamMember>) => {
          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const response = await fetch(`/api/team/${memberId}`, {
              method: 'PATCH',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              },
              body: JSON.stringify(data),
            });

            if (!response.ok) {
              throw new Error('Failed to update team member');
            }

            const updatedMember = await response.json();
            
            set(state => ({ 
              teamMembers: state.teamMembers.map(member => 
                member.id === memberId ? {
                  ...updatedMember,
                  invitedAt: updatedMember.invitedAt ? new Date(updatedMember.invitedAt) : undefined,
                  joinedAt: updatedMember.joinedAt ? new Date(updatedMember.joinedAt) : undefined
                } : member
              ), 
              isLoading: false 
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update team member', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Remove Team Member Action
        removeTeamMember: async (memberId: string) => {
          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const response = await fetch(`/api/team/${memberId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              }
            });

            if (!response.ok) {
              throw new Error('Failed to remove team member');
            }
            
            set(state => ({ 
              teamMembers: state.teamMembers.filter(member => member.id !== memberId), 
              isLoading: false 
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to remove team member', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Resend Invitation Action
        resendInvitation: async (memberId: string) => {
          set({ isLoading: true, error: null });
          
          try {
            // TODO: Replace with actual API call
            const response = await fetch(`/api/team/${memberId}/resend-invitation`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              }
            });

            if (!response.ok) {
              throw new Error('Failed to resend invitation');
            }
            
            set({ isLoading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to resend invitation', 
              isLoading: false 
            });
            throw error;
          }
        },

        // Onboarding Actions
        setOnboardingStep: (step: number) => set({ onboardingStep: step }),
        
        updateOnboardingData: (data: Partial<BusinessOnboardingData>) => 
          set(state => ({ 
            onboardingData: { ...state.onboardingData, ...data } 
          })),
        
        clearOnboardingData: () => set({ onboardingData: {}, onboardingStep: 1 }),

        // Utility Actions
        clearError: () => set({ error: null }),
        setLoading: (loading: boolean) => set({ isLoading: loading }),
      }),
      {
        name: 'business-store',
        partialize: (state) => ({ 
          business: state.business,
          onboardingStep: state.onboardingStep,
          onboardingData: state.onboardingData
        }),
      }
    ),
    { name: 'BusinessStore' }
  )
);