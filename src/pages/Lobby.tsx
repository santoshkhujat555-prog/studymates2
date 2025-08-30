import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useLobby } from '@/hooks/useLobby';
import { ArrowLeft, Users, Trophy, Clock, UserCheck } from 'lucide-react';

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
    id: 'study-match-2',
    title: 'Study Buddy Match',
    description: 'Get matched with a study partner who shares your academic interests',
    players: 2,
    icon: <Users className="h-6 w-6" />,
    difficulty: 'Easy',
    estimatedTime: '30 min'
  },
  {
    id: 'study-match-4',
    title: 'Study Group Formation',
    description: 'Join a group of 4 students with similar goals and subjects',
    players: 4,
    icon: <Users className="h-6 w-6" />,
    difficulty: 'Medium',
    estimatedTime: '45 min'
  },
  {
    id: 'peer-review-2',
    title: 'Peer Review Session',
    description: 'Exchange knowledge and review each other\'s work',
    players: 2,
    icon: <Trophy className="h-6 w-6" />,
    difficulty: 'Medium',
    estimatedTime: '25 min'
  },
  {
    id: 'collaborative-4',
    title: 'Collaborative Learning',
    description: 'Work together on complex problems with 3 other students',
    players: 4,
    icon: <Trophy className="h-6 w-6" />,
    difficulty: 'Hard',
    estimatedTime: '60 min'
  }
];

const Lobby = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLobby, lobbyMembers, isLoading, findOrCreateLobby, leaveLobby } = useLobby();
  const [selectedOption, setSelectedOption] = useState<LobbyOption | null>(null);

  const handleCreateLobby = async (option: LobbyOption) => {
    setSelectedOption(option);
    const lobby = await findOrCreateLobby(option.id, option.players);
    if (!lobby) {
      setSelectedOption(null);
    }
  };

  const handleLeaveLobby = () => {
    leaveLobby();
    setSelectedOption(null);
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'Hard': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/b961a5a2-1ea8-4ae2-a004-5695fca1bd1f.png" 
              alt="StudyMates Logo" 
              className="h-8 w-8 mr-3"
            />
            <h1 className="text-xl font-bold">Create Study Lobby</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Find Your Study Partners</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with fellow students through our matching system. Choose between 1-on-1 sessions or group studies.
          </p>
        </div>

        {/* Lobby Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {lobbyOptions.map((option) => (
            <Card 
              key={option.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20"
              onClick={() => handleCreateLobby(option)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {option.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{option.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {option.players} Players
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getDifficultyColor(option.difficulty)}`}
                        >
                          {option.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {option.description}
                </CardDescription>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {option.estimatedTime}
                  </div>
                  <Button size="sm">
                    Create Lobby
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lobby Status */}
        {currentLobby && (
          <div className="mt-8 max-w-2xl mx-auto">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="text-center">
                <CardTitle className="text-lg">
                  {currentLobby.status === 'waiting' ? 'Finding Your Study Partners' : 'Lobby Ready!'}
                </CardTitle>
                <CardDescription>
                  {currentLobby.status === 'waiting' 
                    ? `Waiting for ${currentLobby.max_players - currentLobby.current_players} more player${currentLobby.max_players - currentLobby.current_players !== 1 ? 's' : ''}`
                    : 'All players have joined! Ready to start.'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentLobby.status === 'waiting' && (
                  <div className="text-center mb-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">
                      We're matching you based on your interests, study schedule, and academic goals.
                    </p>
                  </div>
                )}

                {/* Current Members */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Current Members ({currentLobby.current_players}/{currentLobby.max_players})</h4>
                  <div className="grid gap-2">
                    {lobbyMembers.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-2 bg-card rounded border">
                        <UserCheck className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">
                          {member.profiles?.full_name || 'Anonymous Student'}
                        </span>
                        {member.user_id === user?.id && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                    ))}
                    
                    {/* Empty slots */}
                    {Array.from({ length: currentLobby.max_players - currentLobby.current_players }).map((_, index) => (
                      <div key={`empty-${index}`} className="flex items-center space-x-3 p-2 border border-dashed rounded">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Waiting for player...</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  {currentLobby.status === 'full' && (
                    <Button className="flex-1">
                      Start Session
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={handleLeaveLobby}
                    disabled={isLoading}
                  >
                    Leave Lobby
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Lobby;