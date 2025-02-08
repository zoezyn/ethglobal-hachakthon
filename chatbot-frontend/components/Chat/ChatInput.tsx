import { Message } from "@/types";
import { FC, KeyboardEvent, useRef, useState } from "react";

interface Props {
  onSend: (message: Message) => void;
}

export const ChatInput: FC<Props> = ({ onSend }) => {
  const [content, setContent] = useState<string>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!content) {
      return;
    }

    onSend({ role: "user", content });
    setContent("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = "24px";
    textarea.style.height = `${textarea.scrollHeight}px`;
    setContent(textarea.value);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        className="min-h-[44px] w-full rounded-lg px-4 py-3 bg-[#0f172a] text-white border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        style={{ resize: "none" }}
        placeholder="Type a message..."
        value={content}
        rows={1}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />

      <button
        className="absolute right-3 bottom-[10px] rounded-lg p-1 text-gray-400 hover:text-blue-500 hover:bg-[#1e293b] transition-colors duration-200"
        onClick={handleSend}
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </div>
  );
};
