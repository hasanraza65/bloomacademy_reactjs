import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  X, 
  Download, 
  FileText, 
  Image as ImageIcon 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface ChatMessage {
  type: 'chat';
  id: string;
  senderId: number;
  senderName: string;
  senderRole: number;
  text: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  emoji: string | null;
  timestamp: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: number;
  currentUserName: string;
  currentUserRole: number;
  onSendMessage: (text: string, attachmentFile?: File | null) => void;
  onClose: () => void;
  isRTMReady: boolean;
}

const EMOJIS = [
  '😊', '😂', '🎉', '👍', '❤️', '🔥', '✨', '🙌', 
  '👏', '😍', '🤔', '😅', '💪', '🏆', '⭐', '🚀', 
  '💡', '📚', '✅', '❌', '😢', '😮', '🤩', '👋'
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUserId,
  currentUserName,
  currentUserRole,
  onSendMessage,
  onClose,
  isRTMReady
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if ((!inputText.trim() && !selectedFile) || !isRTMReady) return;
    onSendMessage(inputText, selectedFile);
    setInputText('');
    setSelectedFile(null);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.match('image.*') || file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        alert('Only images and PDFs are allowed.');
      }
    }
  };

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const shouldShowTimestamp = (idx: number) => {
    if (idx === 0) return true;
    const current = new Date(messages[idx].timestamp).getTime();
    const prev = new Date(messages[idx - 1].timestamp).getTime();
    return current - prev > 5 * 60 * 1000; // 5 minutes
  };

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="h-full flex flex-col bg-slate-900 border-l border-white/5 overflow-hidden"
    >
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-black text-xs uppercase tracking-widest">Class Chat</span>
          <span className="px-2 py-0.5 bg-brand-purple/20 text-brand-purple rounded-full text-[10px] font-black">
            {messages.length}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUserId;
          const isTeacher = msg.senderRole === 2;
          const showTS = shouldShowTimestamp(idx);

          return (
            <div key={msg.id} className="flex flex-col">
              {showTS && (
                <div className="flex items-center justify-center my-4">
                  <div className="px-3 py-1 rounded-full bg-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              )}
              
              <div className={cn("flex flex-col max-w-[85%]", isMe ? "self-end" : "self-start")}>
                {!isMe && (
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-2">
                    {msg.senderName} {isTeacher && "🏆"}
                  </span>
                )}
                
                <div className={cn(
                  "p-3 rounded-2xl relative",
                  isTeacher 
                    ? (isMe ? "bg-brand-purple text-white rounded-tr-none" : "bg-brand-purple/20 text-white border border-brand-purple/20 rounded-tl-none")
                    : (isMe ? "bg-slate-700 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none")
                )}>
                  <p className="text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                  
                  {msg.attachmentUrl && (
                    <div className="mt-2 p-2 rounded-xl bg-black/20 border border-white/5 flex items-center gap-2 group cursor-pointer" 
                         onClick={() => window.open(msg.attachmentUrl!, '_blank')}>
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
                        {msg.attachmentName?.match(/\.(jpg|jpeg|png|gif)$/i) ? <ImageIcon size={14} /> : <FileText size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold truncate text-white/70">{msg.attachmentName}</p>
                      </div>
                      <Download size={14} className="text-white/40 group-hover:text-white transition-colors" />
                    </div>
                  )}
                </div>
                
                <span className={cn("text-[8px] font-bold text-slate-600 mt-1 uppercase", isMe ? "text-right mr-1" : "ml-1")}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 shrink-0 bg-slate-900">
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-24 right-4 bg-slate-800 border border-white/10 rounded-2xl p-3 grid grid-cols-6 gap-2 shadow-2xl z-20"
            >
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    setInputText(prev => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10 rounded-xl transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {selectedFile && (
          <div className="mb-3 p-2 bg-brand-purple/10 border border-brand-purple/20 rounded-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-purple/20 flex items-center justify-center text-brand-purple">
              {selectedFile.type.match('image.*') ? <ImageIcon size={14} /> : <FileText size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold truncate text-white">{selectedFile.name}</p>
              <p className="text-[8px] text-white/40 uppercase tracking-widest font-black">Ready to send</p>
            </div>
            <button 
              onClick={() => setSelectedFile(null)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 bg-slate-800 border border-white/10 rounded-2xl p-2 focus-within:border-brand-purple/50 transition-colors">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type message..."
              rows={1}
              className="w-full bg-transparent border-none focus:ring-0 text-white text-sm font-medium p-2 resize-none max-h-32 placeholder:text-slate-500"
              style={{ height: 'auto', minHeight: '40px' }}
            />
            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={cn("p-1.5 rounded-lg transition-colors", showEmojiPicker ? "bg-brand-purple/20 text-brand-purple" : "text-slate-400 hover:text-white hover:bg-white/5")}
                >
                  <Smile size={18} />
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn("p-1.5 rounded-lg transition-colors", selectedFile ? "bg-brand-purple/20 text-brand-purple" : "text-slate-400 hover:text-white hover:bg-white/5")}
                >
                  <Paperclip size={18} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={(!inputText.trim() && !selectedFile) || !isRTMReady}
                className="w-10 h-10 rounded-xl bg-brand-purple text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
