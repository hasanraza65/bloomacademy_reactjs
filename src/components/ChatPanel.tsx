import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  X, 
  Download, 
  FileText, 
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useLanguage } from '../context/LanguageContext';

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
  isUploading?: boolean;
  uploadProgress?: number;
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
  isRTMReady,
  isUploading = false,
  uploadProgress = 0,
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

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
        alert(t('class.onlyImagesPDF'));
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
    <>
      <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="h-full flex flex-col bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="h-12 px-6 flex items-center justify-between border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-black text-xs uppercase tracking-widest">{t('class.chat')}</span>
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
                    <>
                      {msg.attachmentName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <div 
                          className="mt-2 rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setLightbox({ url: msg.attachmentUrl!, name: msg.attachmentName! })}
                        >
                          <img 
                            src={msg.attachmentUrl} 
                            alt={msg.attachmentName} 
                            className="w-full h-auto max-h-48 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="p-2 bg-black/40 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white/70 truncate">{msg.attachmentName}</span>
                            <Download size={12} className="text-white/40 shrink-0" />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 p-2 rounded-xl bg-black/20 border border-white/5 flex items-center gap-2 group cursor-pointer" 
                             onClick={() => window.open(msg.attachmentUrl!, '_blank')}>
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
                            <FileText size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold truncate text-white/70">{msg.attachmentName}</p>
                          </div>
                          <Download size={14} className="text-white/40 group-hover:text-white transition-colors" />
                        </div>
                      )}
                    </>
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
      <div className="p-4 border-t border-white/5 shrink-0 bg-slate-900 relative">
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-4 right-4 mb-2 bg-slate-800 border border-white/10 rounded-2xl p-3 grid grid-cols-6 gap-2 shadow-2xl z-20"
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
              <p className="text-[8px] text-white/40 uppercase tracking-widest font-black">{t('chat.readyToSend')}</p>
            </div>
            <button 
              onClick={() => setSelectedFile(null)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {isUploading && (
          <div className="mb-3 p-3 bg-brand-purple/10 border border-brand-purple/20 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin text-brand-purple" size={12} />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('chat.uploading')}</span>
              </div>
              <span className="text-[10px] font-black text-brand-purple uppercase tracking-widest">{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${uploadProgress}%` }}
                 className="h-full bg-brand-purple rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
               />
            </div>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 bg-slate-800 border border-white/10 rounded-2xl p-2 focus-within:border-brand-purple/50 transition-colors">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.placeholder')}
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

    <AnimatePresence>
      {lightbox && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const a = document.createElement('a');
                a.href = lightbox.url;
                a.download = lightbox.name;
                a.target = '_blank';
                a.click();
              }}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              title="Download"
            >
              <Download size={24} />
            </button>
            <button
              onClick={() => setLightbox(null)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              title="Close"
            >
              <X size={24} />
            </button>
          </div>
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={lightbox.url} 
              alt={lightbox.name} 
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{lightbox.name}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
);
};
