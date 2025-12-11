import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { hybridDecrypt } from '../utils/encryption';

export default function ChatScreen() {
  const route = useRoute();
  const { chatId, otherUser } = route.params;
  const { socket } = useSocket();
  const { user, privateKey } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadMessages();
    setupSocketListeners();

    return () => {
      if (socket) {
        socket.off('message:new');
        socket.off('message:sent');
        socket.off('typing:start');
        socket.off('typing:stop');
      }
    };
  }, [socket, chatId]);

  const loadMessages = async () => {
    try {
      const response = await api.get(`/messages/chat/${chatId}`);
      const loadedMessages = await Promise.all(
        response.data.messages.map(async (msg) => {
          try {
            // Decrypt message if we're the receiver
            if (msg.receiverId._id === user._id && privateKey) {
              const decrypted = await hybridDecrypt(
                msg.encryptedContent,
                msg.encryptionKey,
                msg.iv,
                msg.authTag,
                privateKey
              );
              return { ...msg, decryptedContent: decrypted };
            }
            return msg;
          } catch (error) {
            console.error('Error decrypting message:', error);
            return { ...msg, decryptedContent: '[Unable to decrypt]' };
          }
        })
      );
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.on('message:new', async (data) => {
      const { message } = data;
      if (message.chatId === chatId) {
        try {
          // Decrypt the message
          if (privateKey) {
            const decrypted = await hybridDecrypt(
              message.encryptedContent,
              message.encryptionKey,
              message.iv,
              message.authTag,
              privateKey
            );
            message.decryptedContent = decrypted;
          }
          setMessages((prev) => [...prev, message]);
          
          // Mark as read
          socket.emit('message:read', { messageIds: [message._id] });
        } catch (error) {
          console.error('Error handling new message:', error);
        }
      }
    });

    socket.on('message:sent', (data) => {
      // Handle sent confirmation
      console.log('Message sent:', data);
    });
  };

  const sendMessage = () => {
    if (!inputText.trim() || !socket) return;

    socket.emit('message:send', {
      receiverId: otherUser._id,
      content: inputText.trim(),
      messageType: 'text'
    });

    setInputText('');
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.senderId._id === user._id;
    const content = item.decryptedContent || item.content || '[Encrypted]';

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.otherMessage
        ]}
      >
        <Text style={[styles.messageText, isMyMessage && { color: '#fff' }]}>{content}</Text>
        <Text style={[styles.messageTime, isMyMessage && { color: 'rgba(255,255,255,0.7)' }]}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  messagesList: {
    padding: 16
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF'
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA'
  },
  messageText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    alignSelf: 'flex-end'
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    justifyContent: 'center'
  },
  sendButtonDisabled: {
    opacity: 0.5
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600'
  }
});

