import ChatWindow from "@/components/ChatWindow";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-800">
      {/* Welcome Section */}
      <h1 className="text-3xl font-bold mb-4">Welcome to QueryMate 🤖</h1>
      <p className="text-gray-600 mb-6 text-center max-w-lg">
        Your personal AI chatbot powered by Gemini. Start a new chat from the sidebar or continue where you left off.
      </p>

      {/* Chat Window */}
      <ChatWindow />
    </div>
  );
}
