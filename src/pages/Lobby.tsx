import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useLobby } from '@/hooks/useLobby';
import { ArrowLeft, Users, Trophy, Clock, X, Copy, UserPlus, Check } from 'lucide-react';
import { toast } from 'sonner';

interface LobbyOption {
  id: string;
  title: string;
  description: string;
  players: 2 | 4;
  icon: React.ReactNode;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTime: string;
}

const lobbyOptions: LobbyOption[] = [
  {
    id: 'quiz-2',
    title: '2 Player Quiz',
    description: 'Head-to-head quiz competition with a friend',
    players: 2,
    icon: <Users className="h-6 w-6" />,
    difficulty: 'Easy',
    estimatedTime: '15 min'
  },
  {
    id: 'quiz-4',
    title: '4 Player Quiz',
    description: 'Group quiz competition with up to 4 players',
    players: 4,
    icon: <Trophy className="h-6 w-6" />,
    difficulty: 'Medium',
    estimatedTime: '20 min'
  }
];

const Lobby = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLobby, lobbyMembers, isLoading, createPrivateLobby, joinLobbyByCode, leaveLobby, sendUserInvitation } = useLobby();
  
  const [selectedOption, setSelectedOption] = useState<LobbyOption | null>(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [userCode, setUserCode] = useState('');

  const handleCreateLobby = async (option: LobbyOption) => {
    setSelectedOption(option);
    await createPrivateLobby(option.id, option.players);
  };

  const handleJoinLobby = async () => {
    if (joinCode.trim()) {
      const result = await joinLobbyByCode(joinCode.trim());
      if (result) {
        setShowJoinDialog(false);
        setJoinCode('');
      }
    }
  };

  const handleSendInvite = async () => {
    if (userCode.trim() && currentLobby) {
      const result = await sendUserInvitation(userCode.trim(), currentLobby.id);
      if (result) {
        setShowInviteDialog(false);
        setUserCode('');
      }
    }
  };

  const copyInviteCode = async () => {
    if (currentLobby?.invite_code) {
      await navigator.clipboard.writeText(currentLobby.invite_code);
      setCopied(true);
      toast.success('Invite code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };


  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'Hard': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const renderPlayerSlot = (index: number, member?: any) => {
    const isHost = index === 0;
    const isEmpty = !member;
    
    return (
      <div 
        key={index} 
        className={`p-4 rounded-lg border-2 ${isEmpty ? 'border-dashed border-muted-foreground/30 bg-muted/10' : 'border-primary/20 bg-card'}`}
      >
        {isEmpty ? (
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                <UserPlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Waiting for player</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowInviteDialog(true)}
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Invite Player
              </Button>
            </div>
        ) : (
          <div className="text-center space-y-2">
            <Avatar className="w-12 h-12 mx-auto">
              <AvatarImage src={member.profiles?.avatar_url} />
              <AvatarFallback>
                {member.profiles?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {member.profiles?.full_name || 'Anonymous'}
                {member.user_id === user?.id && ' (You)'}
              </p>
              {isHost && <Badge variant="outline" className="text-xs mt-1">Host</Badge>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center">
            <img src="/lovable-uploads/b961a5a2-1ea8-4ae2-a004-5695fca1bd1f.png" alt="StudyMates Logo" className="h-8 w-8 mr-3" />
            <h1 className="text-xl font-bold">Quiz Lobby</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Create Quiz Lobby</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create a private quiz room and invite friends to join for competitive learning.
          </p>
        </div>

        {/* Active Lobby */}
        {currentLobby && (
          <div className="max-w-2xl mx-auto mb-8">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedOption?.title || 'Quiz Lobby'}
                    </CardTitle>
                    <CardDescription>
                      {currentLobby.current_players}/{currentLobby.max_players} players joined
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={leaveLobby} disabled={isLoading}>
                    <X className="h-4 w-4 mr-1" />
                    Leave
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Invite Code */}
                {currentLobby.invite_code && (
                  <div className="p-3 bg-card rounded-lg border text-center">
                    <p className="text-sm text-muted-foreground mb-2">Share this code with friends:</p>
                    <div className="flex items-center justify-center space-x-2">
                      <code className="px-3 py-1 bg-muted rounded text-lg font-mono">
                        {currentLobby.invite_code}
                      </code>
                      <Button variant="outline" size="sm" onClick={copyInviteCode}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Player Tables */}
                <div className={`grid ${currentLobby.max_players === 4 ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                  {Array.from({ length: currentLobby.max_players }, (_, index) =>
                    renderPlayerSlot(index, lobbyMembers[index])
                  )}
                </div>

                {/* Start Game Button */}
                {currentLobby.status === 'full' && (
                  <div className="text-center space-y-3">
                    <div className="p-3 bg-green-500/10 text-green-600 border border-green-500/20 rounded-lg">
                      <p className="font-medium">All players joined! Ready to start the quiz!</p>
                    </div>
                    <Button 
                      onClick={() => navigate('/quiz')} 
                      className="w-full"
                      size="lg"
                    >
                      Start Quiz Competition
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lobby Creation Options - Only show if not in a lobby */}
        {!currentLobby && (
          <div className="space-y-8">
            {/* Join Existing Lobby */}
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => setShowJoinDialog(true)}
                className="mb-8"
              >
                Join with Invite Code
              </Button>
            </div>

            {/* Create New Lobby */}
            <div>
              <h3 className="text-xl font-semibold text-center mb-6">Or Create a New Lobby</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {lobbyOptions.map((option) => (
                  <Card 
                    key={option.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20" 
                    onClick={() => !isLoading && handleCreateLobby(option)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary">{option.icon}</div>
                          <div>
                            <CardTitle className="text-lg">{option.title}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">{option.players} Players</Badge>
                              <Badge variant="outline" className={`text-xs ${getDifficultyColor(option.difficulty)}`}>
                                {option.difficulty}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">{option.description}</CardDescription>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {option.estimatedTime}
                        </div>
                        <Button size="sm" disabled={isLoading}>
                          {isLoading ? 'Creating...' : 'Create Lobby'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Join Dialog */}
        <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join Quiz Lobby</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Enter Invite Code</label>
                <Input
                  placeholder="e.g. ABC12345"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="mt-1"
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowJoinDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleJoinLobby}
                  disabled={!joinCode.trim() || isLoading}
                  className="flex-1"
                >
                  Join Lobby
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Invite User Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Player</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Enter User ID (6 digits)</label>
                <Input
                  placeholder="e.g. 123456"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-1"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the 6-digit user ID of the player you want to invite
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowInviteDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendInvite}
                  disabled={userCode.length !== 6 || isLoading}
                  className="flex-1"
                >
                  Send Invite
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
};

export default Lobby;