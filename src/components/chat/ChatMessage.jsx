import { motion } from 'framer-motion';
import ChatAvatar from './ChatAvatar';

export default function ChatMessage({ msg, isOwn, formatDateTime }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} gap-2 px-1`}
    >
      {/* Avatar for others */}
      {!isOwn && <ChatAvatar name={msg.username} />}
      
      {/* Message container */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} gap-0.5 max-w-[75%]`}>
        {/* Sender name for others */}
        {!isOwn && (
          <p className="text-xs font-semibold text-gray-600 px-3 leading-none">
            {msg.username}
          </p>
        )}
        
        {/* Message bubble */}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
            isOwn
              ? 'bg-emerald-500 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
          }`}
        >
          {msg.content}
        </div>
        
        {/* Timestamp */}
        <p className={`text-[11px] text-gray-500 font-medium px-3 mt-0.5 ${isOwn ? 'text-right' : 'text-left'}`}>
          {formatDateTime(msg.created_date)}
        </p>
      </div>
    </motion.div>
  );
}