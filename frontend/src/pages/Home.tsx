import { useState, useEffect } from 'react'
import reactLogo from '../assets/react.svg'
import viteLogo from '/vite.svg'

interface Message {
  id: number;
  content: string;
  created_at: string;
}

function Home() {
  const [count, setCount] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [apiStatus, setApiStatus] = useState<string>('Checking...')

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth()
    fetchMessages()
  }, [])

  const checkApiHealth = async () => {
    try {
      const response = await fetch('/api/health/')
      const data = await response.json()
      setApiStatus(data.message || 'API is healthy')
    } catch (error) {
      setApiStatus('API connection failed')
      console.error('API Health check failed:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages/')
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const createMessage = async () => {
    if (!newMessage.trim()) return
    
    try {
      const response = await fetch('/api/messages/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage }),
      })
      
      if (response.ok) {
        setNewMessage('')
        fetchMessages() // Refresh messages
      }
    } catch (error) {
      console.error('Failed to create message:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10 text-center">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex justify-center gap-8">
          <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
            <img 
              src={viteLogo} 
              className="h-24 p-6 transition-all duration-300 will-change-auto hover:drop-shadow-[0_0_2em_#646cffaa]" 
              alt="Vite logo" 
            />
          </a>
          <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
            <img 
              src={reactLogo} 
              className="h-24 animate-spin p-6 transition-all duration-300 will-change-auto hover:drop-shadow-[0_0_2em_#61dafbaa]" 
              alt="React logo" 
              style={{ animationDuration: '20s' }}
            />
          </a>
        </div>

        <h1 className="mb-8 text-4xl font-bold text-gray-900">
          Vite + React + Django
        </h1>
        
        <div className="mb-8 rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-6">
            <h3 className="mb-2 text-xl font-semibold text-gray-800">API Status</h3>
            <p className={`font-medium ${apiStatus.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
              {apiStatus}
            </p>
          </div>

          <div className="mb-6">
            <button 
              onClick={() => setCount((count) => count + 1)}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              count is {count}
            </button>
          </div>

          <div className="mb-6">
            <h3 className="mb-4 text-xl font-semibold text-gray-800">Messages</h3>
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Enter a message"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button 
                onClick={createMessage}
                className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Add Message
              </button>
            </div>
            
            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
              {messages.length === 0 ? (
                <p className="p-4 text-gray-500">No messages yet. Add one above!</p>
              ) : (
                <div className="space-y-2 p-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-left"
                    >
                      <p className="font-medium text-gray-800">{message.content}</p>
                      <small className="text-gray-500">
                        Created: {new Date(message.created_at).toLocaleString()}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-gray-700 space-y-2">
            <p>
              Explore the cosmos with our interactive visualizations:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>🪐 <strong className="text-purple-600">Solar System</strong> - Explore our solar system and double-click Earth to zoom in!</li>
            </ul>
          </div>
        </div>

        <p className="text-gray-600">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </div>
  )
}

export default Home