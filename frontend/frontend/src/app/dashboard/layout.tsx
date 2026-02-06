"use client";

import { useAuth } from '@/context/AuthContext';
import { Mail, LogOut, User as UserIcon } from 'lucide-react';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Mail className="text-white w-6 h-6" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">InboxFlow</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pr-4 border-r border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-200">
                  {user?.picture ? (
                    <Image src={user.picture} alt={user.name || 'User'} width={40} height={40} />
                  ) : (
                    <UserIcon className="text-gray-400 w-6 h-6" />
                  )}
                </div>
              </div>
              
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
