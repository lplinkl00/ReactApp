import React, { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "./components/Header";
import { CampaignMap } from "./components/CampaignMap";
import { Dashboard } from "./components/Dashboard";
import { FilterPanel } from "./components/FilterPanel";
import { mockCampaigns, Campaign } from "./data/campaigns";
import Globe from './Globe';

// ---------------------------------------------
// Chatbot Sidebar (single-file, shadcn-chat inspired)
// - Tailwind classes used (assumes Tailwind is set up)
// - Lightweight, nice UI, message bubbles, typing state
// ---------------------------------------------

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  time: string;
};

function formatTime(d = new Date()) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function useAutoId(prefix = "msg") {
  const ctr = useRef(0);
  return (seed?: string) => `${prefix}_${seed ?? ctr.current++}`;
}

function ChatbotSidebar({ className = "" }: { className?: string }) {
  const makeId = useAutoId();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: makeId('welcome'), role: 'assistant', text: 'Hi! I\'m here to help you explore campaigns and find volunteer opportunities. Ask me anything!', time: formatTime() }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // scroll to bottom whenever messages change
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

 const sendMessage = async (text: string) => {
  if (!text.trim()) return;
  const userMsg: ChatMessage = { id: makeId('u'), role: 'user', text: text.trim(), time: formatTime() };
  setMessages((m) => [...m, userMsg]);
  setInput("");
  setIsTyping(true);

  // Fetch reply from Python backend
  const replyText = await fetchBotReply(text.trim());

  const botMsg: ChatMessage = { id: makeId('b'), role: 'assistant', text: replyText, time: formatTime() };
  setMessages((m) => [...m, botMsg]);
  setIsTyping(false);
};


  // Small heuristic reply generator (so UI feels real). Replace with calls to your chatbot backend.
async function fetchBotReply(userText: string) {
  try {
    const res = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: userText }),
    });

    const data = await res.json();
    return data.reply ?? "Sorry, I didn't understand that.";
  } catch (err) {
    console.error("Chatbot fetch error:", err);
    return "Error contacting server.";
  }
}


  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <aside className={`fixed right-0 top-0 bottom-0 w-[400px] flex flex-col bg-white border-l border-gray-200 shadow-lg ${className} z-50`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-semibold">CB</div>
          <div>
            <div className="text-sm font-semibold">Campaign Chat</div>
            <div className="text-xs text-gray-500">Ask about campaigns, volunteers & orgs</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
            aria-label="Clear chat"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-9 h-9 rounded-full flex-shrink-0 bg-gray-100 flex items-center justify-center text-gray-700 mr-3">🤖</div>
            )}
            <div className={`max-w-[78%] ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-3 rounded-2xl ${m.role === 'user' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                <div className="whitespace-pre-wrap break-words">{m.text}</div>
              </div>
              <div className="text-[11px] text-gray-400 mt-1">{m.time}</div>
            </div>
            {m.role === 'user' && (
              <div className="w-7" />
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full flex-shrink-0 bg-gray-100 flex items-center justify-center text-gray-700">🤖</div>
            <div className="bg-gray-100 p-2 rounded-2xl">
              <div className="flex gap-1 w-12">
                <div className="w-2 h-2 rounded-full animate-bounce bg-gray-400"></div>
                <div className="w-2 h-2 rounded-full animate-bounce bg-gray-400 delay-150"></div>
                <div className="w-2 h-2 rounded-full animate-bounce bg-gray-400 delay-300"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="px-4 py-3 border-t bg-black">
        <label htmlFor="chat-input" className="sr-only">Message</label>
        <div className="flex gap-2">
          <textarea
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about campaigns, e.g. \'show urgent campaigns\"
            className="resize-none flex-1 min-h-[44px] max-h-36 p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-gray-900"
          />
          <button
            onClick={() => sendMessage(input)}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            disabled={!input.trim()}
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------
// Main App (your original content, with ChatbotSidebar added)
// ---------------------------------------------

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Campaign["status"] | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showChat, setShowChat] = useState(true);

  // Get unique organizations
  const organizations = useMemo(() => {
    return Array.from(new Set(mockCampaigns.map((c) => c.organization))).sort();
  }, []);

  // Get unique statuses
  const statuses: Campaign["status"][] = ["active", "completed", "urgent"];

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    return mockCampaigns.filter((campaign) => {
      const matchesSearch =
        searchQuery === "" ||
        campaign.organization.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesOrg = selectedOrg === null || campaign.organization === selectedOrg;
      const matchesStatus = selectedStatus === null || campaign.status === selectedStatus;

      return matchesSearch && matchesOrg && matchesStatus;
    });
  }, [searchQuery, selectedOrg, selectedStatus]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Auto-select organization if exact match
    const exactMatch = organizations.find(
      (org) => org.toLowerCase() === query.toLowerCase()
    );
    if (exactMatch) {
      setSelectedOrg(exactMatch);
    } else if (query === "") {
      setSelectedOrg(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onSearch={handleSearch} searchQuery={searchQuery} />

      <FilterPanel
        organizations={organizations}
        selectedOrg={selectedOrg}
        onSelectOrg={setSelectedOrg}
        statuses={statuses}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main content (left / center) */}
        <main className={`flex-1 flex flex-col transition-padding duration-300 ${showChat ? 'pr-[400px]' : ''}`}>
          {/* Map Section */}
          <div className="p-4">
            <div className="max-w-7xl mx-auto">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-gray-900">Campaign Map</h2>
                  <p className="text-gray-600">
                    {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? "s" : ""} found
                  </p>
                </div>
                <div className="flex gap-4 text-sm items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">Urgent</span>
                  </div>

                  {/* Chat toggle on right of the map header */}
                  <button
                    onClick={() => setShowChat((s) => !s)}
                    className="ml-4 px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                  >
                    {showChat ? 'Hide Chat' : 'Open Chat'}
                  </button>
                </div>
              </div>
              <div className="h-[500px]">
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {showMap ? 'Hide Map' : 'Show Volunteer Opportunities Map'}
                </button>
                {showMap && <Globe />}
                {searchQuery && !showMap && (
                  <p className="text-gray-600">
                    Searching for: <strong>{searchQuery}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dashboard Section */}
          <Dashboard
            campaigns={filteredCampaigns}
            organization={selectedOrg}
          />
        </main>

        {/* Chat sidebar (right) */}
        {showChat && <ChatbotSidebar />}
      </div>
    </div>
  );
}
