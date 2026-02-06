"use client";

import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';

export default function Home() {
  const { login } = useAuth();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      const response = await api.post('/auth/google', {
        token: credentialResponse.credential,
      });
      login(response.data.token, response.data.user);
      toast.success('Successfully logged in!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to log in with Google');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
          <Mail className="text-white w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">InboxFlow</h1>
        <p className="text-gray-600 mb-8">
          The ultimate email scheduling platform. Connect your Google account to get started.
        </p>
        
        <div className="w-full flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => {
              toast.error('Google Login Failed');
            }}
            useOneTap
            theme="filled_blue"
            shape="pill"
          />
        </div>

        <p className="mt-8 text-xs text-gray-400">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
