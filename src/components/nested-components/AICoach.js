import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../context/Auth';
import '../../styles/desktop/AICoach.scss';

const AICoach = () => {
  const { user, profile } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Automatically scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Load welcome message when profile is loaded
  useEffect(() => {
    if (profile) {
      setMessages([
        {
          sender: 'coach',
          text: `Hi ${profile.name || 'there'}! 🏋️‍♂️ I am your NutriFit AI Health Coach. Based on your profile (${profile.age}yo, ${profile.weightKg}kg, aiming for ${profile.targetWeightKg}kg), I can design custom meal plans, recommend macros, or suggest workouts. What are we working on today?`
        }
      ]);
    }
  }, [profile]);

  if (!user || !profile) return null;

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    // Add user message
    const newMessages = [...messages, { sender: 'user', text }];
    setMessages(newMessages);
    setInputValue('');
    setIsThinking(true);

    try {
      const res = await fetch(`${backendUrl}/api/coach/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          question: text,
          userContext: {
            name: profile.name,
            age: profile.age,
            gender: profile.gender,
            heightCm: profile.heightCm,
            weightKg: profile.weightKg,
            activityLevel: profile.activityLevel,
            targetWeightKg: profile.targetWeightKg,
            dailyCalorieTarget: profile.dailyCalorieTarget
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { sender: 'coach', text: data.answer }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'coach', text: "Sorry, I couldn't reach my training modules. Please check your network connection." }
        ]);
      }
    } catch (err) {
      console.error('AI Coach Error:', err);
      setMessages((prev) => [
        ...prev,
        { sender: 'coach', text: 'Error connecting to AI Coach. Please try again later.' }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const suggestions = [
    'Suggest a high-protein dinner',
    `How do I reach my target of ${profile.targetWeightKg}kg?`,
    'Create a quick home workout'
  ];

  return (
    <div className={`ai-coach-wrapper ${isOpen ? 'active' : ''}`}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button className="ai-coach-toggle-btn" onClick={() => setIsOpen(true)}>
          <div className="pulse-ring"></div>
          <svg className="fa-solid fa-robot" viewBox="0 0 640 512">
            <path fill="currentColor" d="M320 0c17.7 0 32 14.3 32 32V96H472c22.1 0 40 17.9 40 40V432c0 22.1-17.9 40-40 40H168c-22.1 0-40-17.9-40-40V136c0-22.1 17.9-40 40-40H288V32c0-17.7 14.3-32 32-32zM168 144c-4.4 0-8 3.6-8 8V424c0 4.4 3.6 8 8 8H472c4.4 0 8-3.6 8-8V152c0-4.4-3.6-8-8-8H168zM240 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm192-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" />
          </svg>
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="ai-coach-chat-box">
          <header className="chat-header">
            <div className="header-title-wrapper">
              <span className="status-dot"></span>
              <h4>NutriFit AI Coach</h4>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </header>

          <div className="chat-messages-container">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.sender}`}>
                <div className="message-bubble">
                  {msg.text.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="chat-message coach">
                <div className="message-bubble thinking">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="chat-suggestions">
            {suggestions.map((sug, i) => (
              <button key={i} className="suggestion-chip" onClick={() => handleSendMessage(sug)}>
                {sug}
              </button>
            ))}
          </div>

          <form
            className="chat-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
          >
            <input
              type="text"
              placeholder="Ask your coach anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isThinking}
            />
            <button type="submit" disabled={isThinking || !inputValue.trim()}>
              <svg className="fa-solid fa-paper-plane" viewBox="0 0 512 512" width="16" height="16">
                <path fill="currentColor" d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L411.8 125.1c3.9-3.9 3.9-10.2 0-14.1s-10.2-3.9-14.1 0L137.2 371.5c-2.9 2.9-6.8 4.5-10.9 4.5H48c-18 0-33.8-11.7-39-29s1.3-36.2 15.5-47.5L445.4 4.3c16.1-12.9 39.2-12.2 54.4 3.1z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AICoach;
