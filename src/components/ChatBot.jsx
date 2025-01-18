import React, { useState, useEffect, useRef } from 'react';
import { FaRobot } from 'react-icons/fa'; // Chat icon from react-icons
import './ChatBot.css'; // Import CSS for styling
import { Client } from '../../lib';

const ChatBot = () => {
    const [isChatOpen, setIsChatOpen] = useState(false); // State to toggle chat window
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Toggle chat window visibility
    const toggleChatWindow = () => {
        setIsChatOpen(!isChatOpen);
    };

    // Function to handle sending messages
    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;
        setIsLoading(true);
        setMessages([...messages, { sender: 'user', text: inputMessage }]);
        try {
            const response = await Client.Instance.PostAsync({
                prompt: inputMessage,
            }, '/api/OpenAI');

            const botResponse = response.data;
            setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: botResponse }]);
        } catch (error) {
            setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: 'OpenAI API request failed with status code TooManyRequests' }]);
        } finally {
            setIsLoading(false);
            setInputMessage('');
        }
    };

    // Handle input field changes
    const handleInputChange = (e) => {
        setInputMessage(e.target.value);
    };

    // Handle the Enter key to send a message
    const handleKeyPress = (e) => {
        if (!isLoading) {
            return;
        }
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    return (
        <>
            {/* Floating Chat Icon */}
            <div className="chat-icon" onClick={toggleChatWindow}>
                <FaRobot size={30} color="white" />
            </div>

            {/* Chat Window */}
            {isChatOpen && (
                <div className="chat-bot">
                    <div className="chat-header">
                        <span>Chat with GPT!</span>
                        <button className="close-chat" onClick={toggleChatWindow}>✕</button>
                    </div>
                    <div className="chat-window">
                        <div className="messages">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
                                >
                                    {message.text}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    <div className="input-container">
                        <input
                            className='input'
                            style={{ height: "37px" }}
                            type="text"
                            placeholder="Type a message..."
                            value={inputMessage}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyPress}
                        />
                        <button className='btn-send' onClick={handleSendMessage} disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatBot;