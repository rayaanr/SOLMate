import ChatInterface from "../components/ChatInterface";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-8">
      <ChatInterface />
    </div>
  );
}
