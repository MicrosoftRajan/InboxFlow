'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Home() {
  const { login } = useAuth();

  const handleSuccess = async (response: any) => {
    try {
      const { data } = await api.post('/auth/google', { token: response.credential });
      login(data.user, data.token);
      toast.success('Successfully logged in!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to login. Please try again.');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-[400px] p-8">
        <h1 className="text-2xl font-bold text-black text-center mb-6">Login</h1>

        <div className="space-y-4">
          <p className="text-sm text-black">Login with Google</p>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => toast.error('Login Failed')}
              useOneTap={false}
              theme="outline"
              shape="rectangular"
              text="signin_with"
            />
          </div>

          <div className="relative flex items-center justify-center py-2">
            <div className="border-t border-gray-200 w-full" />
            <span className="absolute bg-white px-3 text-xs text-black">or</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="button"
            className="w-full py-3 bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold rounded-lg transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    </main>
  );
}
