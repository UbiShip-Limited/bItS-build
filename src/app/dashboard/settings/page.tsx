export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8 pb-6 border-b border-[#1a1a1a]">
        <h1 className="text-3xl font-heading font-bold text-white mb-2 tracking-wide">Settings</h1>
        <p className="text-gray-400 text-lg">Manage your tattoo shop settings</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden hover:border-[#C9A449]/20 transition-all duration-300">
            <div className="p-4 border-b border-[#1a1a1a]">
              <h2 className="text-xl font-semibold text-white">Settings</h2>
            </div>
            <nav className="p-2">
              <ul className="space-y-1">
                <li>
                  <button className="w-full text-left px-4 py-3 rounded-lg bg-[#C9A449]/10 text-[#C9A449] font-medium border border-[#C9A449]/20">
                    Shop Profile
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white font-medium transition-all duration-200">
                    Business Hours
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white font-medium transition-all duration-200">
                    Staff Management
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white font-medium transition-all duration-200">
                    Email Templates
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white font-medium transition-all duration-200">
                    Payment Settings
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white font-medium transition-all duration-200">
                    Account & Security
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white font-medium transition-all duration-200">
                    Notifications
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl shadow-2xl p-6 hover:border-[#C9A449]/20 transition-all duration-300">
            <div className="mb-6 pb-4 border-b border-[#1a1a1a]">
              <h2 className="text-xl font-semibold text-white mb-2">Shop Profile</h2>
              <p className="text-sm text-gray-400">Update your shop&apos;s basic information</p>
            </div>

            <form>
              <div className="space-y-6">
                {/* Shop Logo */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Shop Logo</label>
                  <div className="flex items-center">
                    <div className="h-24 w-24 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center">
                      <span className="text-3xl">🏝️</span>
                    </div>
                    <div className="ml-5">
                      <button type="button" className="bg-transparent py-2 px-4 border border-[#C9A449]/30 rounded-lg shadow-sm text-sm font-medium text-[#C9A449] hover:bg-[#C9A449]/10 hover:border-[#C9A449]/50 transition-all duration-300">
                        Change
                      </button>
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Shop Name */}
                <div>
                  <label htmlFor="shopName" className="block text-sm font-medium text-gray-400 mb-2">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    id="shopName"
                    className="block w-full px-3 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg focus:border-[#C9A449]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A449]/20 text-white font-medium transition-all duration-300"
                    defaultValue="Bowen Island Tattoo Shop"
                  />
                </div>

                {/* Shop Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-2">
                    Shop Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    className="block w-full px-3 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg focus:border-[#C9A449]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A449]/20 text-white font-medium transition-all duration-300"
                    defaultValue="Bowen Island Tattoo Shop specializes in custom designs with a focus on nature-inspired art and traditional motifs. Located on scenic Bowen Island, our artists create unforgettable tattoo experiences."
                  />
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 pb-2 border-b border-[#1a1a1a]">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="block w-full px-3 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg focus:border-[#C9A449]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A449]/20 text-white font-medium transition-all duration-300"
                        defaultValue="info@bowenislandtattoo.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        className="block w-full px-3 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg focus:border-[#C9A449]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A449]/20 text-white font-medium transition-all duration-300"
                        defaultValue="(604) 555-1234"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 pb-2 border-b border-[#1a1a1a]">Address</h3>
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
                  <h3 className="text-lg font-semibold text-white mb-3 pb-2 border-b border-[#1a1a1a]">Social Media</h3>
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
                <div className="flex justify-end pt-4 border-t border-[#1a1a1a]">
                  <button
                    type="submit"
                    className="bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] px-6 py-3 rounded-lg font-medium shadow-lg shadow-[#C9A449]/20 transition-all duration-300"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
