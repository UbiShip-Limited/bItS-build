export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your tattoo shop settings</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Settings</h2>
            </div>
            <nav className="p-2">
              <ul>
                <li>
                  <button className="w-full text-left px-4 py-2 rounded-md bg-blue-50 text-blue-700 font-medium">
                    Shop Profile
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                    Business Hours
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                    Staff Management
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                    Email Templates
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                    Payment Settings
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                    Account & Security
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                    Notifications
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-2">Shop Profile</h2>
              <p className="text-sm text-gray-600">Update your shop's basic information</p>
            </div>

            <form>
              <div className="space-y-6">
                {/* Shop Logo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop Logo</label>
                  <div className="flex items-center">
                    <div className="h-24 w-24 rounded-lg bg-gray-200 flex items-center justify-center">
                      <span className="text-3xl">🏝️</span>
                    </div>
                    <div className="ml-5">
                      <button type="button" className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50">
                        Change
                      </button>
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Shop Name */}
                <div>
                  <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    id="shopName"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                    defaultValue="Bowen Island Tattoo Shop"
                  />
                </div>

                {/* Shop Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Shop Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                    defaultValue="Bowen Island Tattoo Shop specializes in custom designs with a focus on nature-inspired art and traditional motifs. Located on scenic Bowen Island, our artists create unforgettable tattoo experiences."
                  />
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-base font-medium mb-3">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                        defaultValue="info@bowenislandtattoo.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                        defaultValue="(604) 555-1234"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-base font-medium mb-3">Address</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        id="street"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                        defaultValue="123 Island Way"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          id="city"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                          defaultValue="Bowen Island"
                        />
                      </div>
                      <div>
                        <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                          Province
                        </label>
                        <input
                          type="text"
                          id="province"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                          defaultValue="British Columbia"
                        />
                      </div>
                      <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                          defaultValue="V0N 1G0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <h3 className="text-base font-medium mb-3">Social Media</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-1">
                        Instagram
                      </label>
                      <input
                        type="text"
                        id="instagram"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                        defaultValue="@bowenislandtattoo"
                      />
                    </div>
                    <div>
                      <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-1">
                        Facebook
                      </label>
                      <input
                        type="text"
                        id="facebook"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                        defaultValue="fb.com/bowenislandtattoo"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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
