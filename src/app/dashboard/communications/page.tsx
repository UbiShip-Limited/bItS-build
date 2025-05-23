import React from 'react';
import Link from 'next/link';

export default function CommunicationsPage() {
  // Mock data for different platforms
  const platforms = [
    { id: 'all', name: 'All Messages', count: 18, color: 'gray' },
    { id: 'facebook', name: 'Facebook Messenger', count: 7, color: 'blue', icon: '📘' },
    { id: 'instagram', name: 'Instagram DM', count: 5, color: 'purple', icon: '📸' },
    { id: 'whatsapp', name: 'WhatsApp', count: 3, color: 'green', icon: '📱' },
    { id: 'email', name: 'Email', count: 3, color: 'red', icon: '📧' },
  ];

  // Mock message data
  const messages = [
    {
      id: 1,
      sender: 'Sarah Johnson',
      platform: 'facebook',
      platformName: 'Facebook Messenger',
      avatar: '/avatars/sarah.jpg',
      preview: 'Hi! I was wondering about availability for a small tattoo next month?',
      time: '2 hours ago',
      unread: true,
      color: 'blue',
      icon: '📘'
    },
    {
      id: 2,
      sender: 'Mike Taylor',
      platform: 'instagram',
      platformName: 'Instagram DM',
      avatar: '/avatars/mike.jpg',
      preview: 'I love the flash designs you posted yesterday. Are they available for booking?',
      time: '5 hours ago',
      unread: true,
      color: 'purple',
      icon: '📸'
    },
    {
      id: 3,
      sender: 'Lisa Chen',
      platform: 'whatsapp',
      platformName: 'WhatsApp',
      avatar: '/avatars/lisa.jpg',
      preview: 'Just confirming our appointment for Wednesday at 2pm',
      time: 'Yesterday',
      unread: true,
      color: 'green',
      icon: '📱'
    },
    {
      id: 4,
      sender: 'Alex Rivera',
      platform: 'email',
      platformName: 'Email',
      avatar: '/avatars/alex.jpg',
      preview: 'Question about aftercare for my recent tattoo...',
      time: 'Yesterday',
      unread: true,
      color: 'red',
      icon: '📧'
    },
    {
      id: 5,
      sender: 'James Wilson',
      platform: 'facebook',
      platformName: 'Facebook Messenger',
      avatar: '/avatars/james.jpg',
      preview: 'I saw your work on a friend and would love to book a consultation',
      time: '2 days ago',
      unread: false,
      color: 'blue',
      icon: '📘'
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Communications Hub</h1>
        <p className="text-gray-600">Manage all your business messages in one place</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar with platforms */}
        <div className="w-full lg:w-1/4">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Message Platforms</h2>
            </div>
            <div className="p-2">
              {platforms.map((platform) => (
                <div 
                  key={platform.id}
                  className={`p-3 rounded-md mb-1 flex justify-between items-center hover:bg-gray-50 cursor-pointer ${platform.id === 'all' ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-center">
                    {platform.icon && <span className="mr-3">{platform.icon}</span>}
                    <span>{platform.name}</span>
                  </div>
                  <span className={`bg-${platform.color}-100 text-${platform.color}-800 rounded-full px-2 py-1 text-xs`}>
                    {platform.count}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
                + Connect New Platform
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="w-full lg:w-3/4">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">All Messages</h2>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                  Mark All Read
                </button>
                <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                  Filter
                </button>
              </div>
            </div>
            
            {/* Message list */}
            <div className="divide-y">
              {messages.map((message) => (
                <div key={message.id} className={`p-4 hover:bg-gray-50 cursor-pointer ${message.unread ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium truncate">{message.sender}</h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{message.time}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${message.color}-100 text-${message.color}-800 mr-2`}>
                          <span className="mr-1">{message.icon}</span>
                          {message.platformName}
                        </span>
                        {message.unread && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm truncate">{message.preview}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 