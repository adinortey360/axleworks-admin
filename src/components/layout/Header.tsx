import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Actions */}
          {actions && <div className="flex items-center gap-2">{actions}</div>}

          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.firstName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-primary-600">
                  {user ? getInitials(user.firstName, user.lastName) : <User className="h-5 w-5" />}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
