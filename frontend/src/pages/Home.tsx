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
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React + Django</h1>
      
      <div className="card">
        <div style={{ marginBottom: '20px' }}>
          <h3>API Status</h3>
          <p style={{ color: apiStatus.includes('failed') ? 'red' : 'green' }}>
            {apiStatus}
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Messages</h3>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Enter a message"
              style={{ marginRight: '10px', padding: '5px' }}
            />
            <button onClick={createMessage}>Add Message</button>
          </div>
          
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {messages.length === 0 ? (
              <p>No messages yet. Add one above!</p>
            ) : (
              messages.map((message) => (
                <div key={message.id} style={{ 
                  border: '1px solid #ccc', 
                  margin: '5px 0', 
                  padding: '10px',
                  borderRadius: '5px'
                }}>
                  <p>{message.content}</p>
                  <small>Created: {new Date(message.created_at).toLocaleString()}</small>
                </div>
              ))
            )}
          </div>
        </div>

        <p>
          Navigate to the <strong>Globe</strong> page to see the CesiumJS visualization!
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default Home