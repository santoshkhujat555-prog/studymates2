import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Send, Video, Mic, MicOff, VideoOff } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
}

const StudyRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (!user || !roomId) return;

    // Simulate real-time connection
    setIsConnected(true);
    toast.success('Connected to study room!');

    // Add some sample messages to simulate activity
    const sampleMessages: Message[] = [
      {
        id: '1',
        user_id: 'system',
        content: 'Welcome to the study room! You can start discussing your topics here.',
        created_at: new Date().toISOString(),
        profiles: {
          full_name: 'System',
          avatar_url: undefined
        }
      }
    ];
    setMessages(sampleMessages);

    return () => {
      setIsConnected(false);
    };
  }, [user, roomId]);

  const sendMessage = () => {
    if (!newMessage.trim() || !user) return;

    const message: Message = {
      id: Date.now().toString(),
      user_id: user.id,
      content: newMessage,
      created_at: new Date().toISOString(),
      profiles: {
        full_name: user.user_metadata?.full_name || 'You',
        avatar_url: user.user_metadata?.avatar_url
      }
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => navigate('/lobby')} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lobby
            </Button>
            <div className="flex items-center">
              <img src="/lovable-uploads/b961a5a2-1ea8-4ae2-a004-5695fca1bd1f.png" alt="StudyMates Logo" className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-xl font-bold">Study Room</h1>
                <p className="text-sm text-muted-foreground">Room: {roomId}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 h-[calc(100vh-80px)] flex gap-6">
        {/* Video Call Area */}
        <div className="flex-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Video Conference</span>
                <div className="flex gap-2">
                  <Button
                    variant={isMuted ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant={isVideoOff ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setIsVideoOff(!isVideoOff)}
                  >
                    {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)]">
              <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Video Chat Ready</p>
                  <p className="text-sm text-muted-foreground">
                    This is where the video chat would appear in a real implementation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="w-80">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Study Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.profiles?.avatar_url} />
                        <AvatarFallback>
                          {message.profiles?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium">
                            {message.profiles?.full_name || 'Anonymous'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <p className="text-sm mt-1 break-words">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="mt-4 flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StudyRoom;