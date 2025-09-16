'use client';

import { useState } from 'react';
import { DashboardPageLayout } from '../components/DashboardPageLayout';
import { DashboardCard } from '../components/DashboardCard';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';
import { AccountSecurityTab } from '@/src/components/settings/AccountSecurityTab';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <DashboardPageLayout
      title="Settings"
      description="Manage your tattoo shop settings"
      breadcrumbs={[{ label: 'Settings' }]}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1">
          <DashboardCard
            title="Settings Menu"
            noPadding
          >
            <nav className="p-2">
              <ul className="space-y-1">
                <li>
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left px-4 py-3 ${components.radius.small} ${typography.fontMedium} ${effects.transitionNormal}
                              ${activeTab === 'profile' 
                                ? `bg-gold-500/10 ${colors.textAccent} border ${colors.borderDefault}` 
                                : `${colors.textSecondary} hover:bg-white/5 hover:${colors.textPrimary}`}`}
                  >
                    Shop Profile
                  </button>
                </li>
                {[
                  { id: 'hours', label: 'Business Hours' },
                  { id: 'staff', label: 'Staff Management' },
                  { id: 'email', label: 'Email Templates' },
                  { id: 'payment', label: 'Payment Settings' },
                  { id: 'account', label: 'Account & Security' },
                  { id: 'notifications', label: 'Notifications' }
                ].map((item) => (
                  <li key={item.id}>
                    <button 
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full text-left px-4 py-3 ${components.radius.small} ${typography.fontMedium} ${effects.transitionNormal}
                                ${activeTab === item.id 
                                  ? `bg-gold-500/10 ${colors.textAccent} border ${colors.borderDefault}` 
                                  : `${colors.textSecondary} hover:bg-white/5 hover:${colors.textPrimary}`}`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </DashboardCard>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2">
          {activeTab === 'account' ? (
            <AccountSecurityTab />
          ) : (
            <DashboardCard
              title={activeTab === 'profile' ? 'Shop Profile' :
                     activeTab === 'hours' ? 'Business Hours' :
                     activeTab === 'staff' ? 'Staff Management' :
                     activeTab === 'email' ? 'Email Templates' :
                     activeTab === 'payment' ? 'Payment Settings' : 'Notifications'}
              subtitle={activeTab === 'profile' ? "Update your shop's basic information" : undefined}
            >

              {activeTab === 'profile' && (
            <form>
              <div className="space-y-6">
                {/* Shop Logo */}
                <div>
                  <label className={`block ${typography.textSm} ${typography.fontMedium} ${colors.textSecondary} mb-2`}>Shop Logo</label>
                  <div className="flex items-center">
                    <div className={`h-24 w-24 ${components.radius.medium} bg-obsidian/50 border ${colors.borderSubtle} flex items-center justify-center`}>
                      <span className="text-3xl">🏝️</span>
                    </div>
                    <div className="ml-5">
                      <button type="button" className={`${components.button.base} ${components.button.sizes.small} ${components.button.variants.secondary}`}>
                        Change
                      </button>
                      <p className={`mt-1 ${typography.textXs} ${colors.textMuted}`}>PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Shop Name */}
                <div>
                  <label htmlFor="shopName" className={`block ${typography.textSm} ${typography.fontMedium} ${colors.textSecondary} mb-2`}>
                    Shop Name
                  </label>
                  <input
                    type="text"
                    id="shopName"
                    className={`${components.input} ${typography.fontMedium}`}
                    defaultValue="Bowen Island Tattoo Shop"
                  />
                </div>

                {/* Shop Description */}
                <div>
                  <label htmlFor="description" className={`block ${typography.textSm} ${typography.fontMedium} ${colors.textSecondary} mb-2`}>
                    Shop Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    className={`${components.input} ${typography.fontMedium}`}
                    defaultValue="Bowen Island Tattoo Shop specializes in custom designs with a focus on nature-inspired art and traditional motifs. Located on scenic Bowen Island, our artists create unforgettable tattoo experiences."
                  />
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className={`${typography.textLg} ${typography.fontSemibold} ${colors.textPrimary} mb-3 pb-2 border-b ${colors.borderSubtle}`}>Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className={`block ${typography.textSm} ${typography.fontMedium} ${colors.textSecondary} mb-2`}>
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className={`${components.input} ${typography.fontMedium}`}
                        defaultValue="info@bowenislandtattoo.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className={`block ${typography.textSm} ${typography.fontMedium} ${colors.textSecondary} mb-2`}>
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        className={`${components.input} ${typography.fontMedium}`}
                        defaultValue="(604) 555-1234"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className={`${typography.textLg} ${typography.fontSemibold} ${colors.textPrimary} mb-3 pb-2 border-b ${colors.borderSubtle}`}>Address</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="street" className="block text-sm font-medium text-gray-400 mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        id="street"
                        className="block w-full px-3 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg focus:border-[#C9A449]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A449]/20 text-white font-medium transition-all duration-300"
                        defaultValue="123 Island Way"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-400 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          id="city"
                          className="block w-full px-3 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg focus:border-[#C9A449]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A449]/20 text-white font-medium transition-all duration-300"
                          defaultValue="Bowen Island"
                        />
                      </div>
                      <div>
                        <label htmlFor="province" className="block text-sm font-medium text-gray-400 mb-2">
                          Province
                        </label>
                        <input
                          type="text"
                          id="province"
                          className="block w-full px-3 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg focus:border-[#C9A449]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A449]/20 text-white font-medium transition-all duration-300"
                          defaultValue="British Columbia"
                        />
                      </div>
                      <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-400 mb-2">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          className="block w-full px-3 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg focus:border-[#C9A449]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A449]/20 text-white font-medium transition-all duration-300"
                          defaultValue="V0N 1G0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <h3 className={`${typography.textLg} ${typography.fontSemibold} ${colors.textPrimary} mb-3 pb-2 border-b ${colors.borderSubtle}`}>Social Media</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="instagram" className="block text-sm font-medium text-gray-400 mb-2">
                        Instagram
                      </label>
                      <input
                        type="text"
                        id="instagram"
                        className="block w-full px-3 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg focus:border-[#C9A449]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A449]/20 text-white font-medium transition-all duration-300"
                        defaultValue="@bowenislandtattoo"
                      />
                    </div>
                    <div>
                      <label htmlFor="facebook" className="block text-sm font-medium text-gray-400 mb-2">
                        Facebook
                      </label>
                      <input
                        type="text"
                        id="facebook"
                        className="block w-full px-3 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg focus:border-[#C9A449]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A449]/20 text-white font-medium transition-all duration-300"
                        defaultValue="fb.com/bowenislandtattoo"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className={`flex justify-end pt-4 border-t ${colors.borderSubtle}`}>
                  <button
                    type="submit"
                    className={`${components.button.base} ${components.button.sizes.medium} ${components.button.variants.primary}`}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
            )}

              {activeTab !== 'profile' && (
                <div className={`text-center py-12`}>
                  <p className={`${colors.textSecondary} mb-4`}>
                    {activeTab === 'hours' && 'Business hours settings coming soon...'}
                    {activeTab === 'staff' && 'Staff management features coming soon...'}
                    {activeTab === 'email' && 'Email template settings coming soon...'}
                    {activeTab === 'payment' && 'Payment settings coming soon...'}
                    {activeTab === 'notifications' && 'Notification preferences coming soon...'}
                  </p>
                </div>
              )}
            </DashboardCard>
          )}
        </div>
      </div>
    </DashboardPageLayout>
  );
}
