import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Brain, Timer, Trophy, Users } from 'lucide-react';

interface QuizOption {
  id: string;
  title: string;
  description: string;
  players: 2 | 4;
  icon: React.ReactNode;
  category: string;
  duration: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: number;
}

const quizOptions: QuizOption[] = [
  {
    id: 'math-duel-2',
    title: 'Math Duel',
    description: 'Compete head-to-head in mathematics problems',
    players: 2,
    icon: <Brain className="h-6 w-6" />,
    category: 'Mathematics',
    duration: '15 min',
    difficulty: 'Medium',
    questions: 20
  },
  {
    id: 'science-battle-4',
    title: 'Science Battle',
    description: 'Team-based science quiz with 4 participants',
    players: 4,
    icon: <Trophy className="h-6 w-6" />,
    category: 'Science',
    duration: '20 min',
    difficulty: 'Hard',
    questions: 25
  },
  {
    id: 'english-challenge-2',
    title: 'English Challenge',
    description: 'Test your language skills against another student',
    players: 2,
    icon: <Brain className="h-6 w-6" />,
    category: 'English',
    duration: '10 min',
    difficulty: 'Easy',
    questions: 15
  },
  {
    id: 'history-quiz-4',
    title: 'History Quiz Arena',
    description: 'Four-player competitive history knowledge test',
    players: 4,
    icon: <Trophy className="h-6 w-6" />,
    category: 'History',
    duration: '25 min',
    difficulty: 'Medium',
    questions: 30
  },
  {
    id: 'general-knowledge-2',
    title: 'GK Showdown',
    description: 'General knowledge face-off between two students',
    players: 2,
    icon: <Brain className="h-6 w-6" />,
    category: 'General Knowledge',
    duration: '12 min',
    difficulty: 'Easy',
    questions: 18
  },
  {
    id: 'aptitude-test-4',
    title: 'Aptitude Championship',
    description: 'Logical reasoning and aptitude test for 4 players',
    players: 4,
    icon: <Trophy className="h-6 w-6" />,
    category: 'Aptitude',
    duration: '30 min',
    difficulty: 'Hard',
    questions: 35
  }
];

const Quiz = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedQuiz, setSelectedQuiz] = useState<QuizOption | null>(null);
  const [filterPlayers, setFilterPlayers] = useState<'all' | 2 | 4>('all');

  const handleStartQuiz = (quiz: QuizOption) => {
    setSelectedQuiz(quiz);
    // Here you would typically create the quiz room and start matching
    console.log('Starting quiz:', quiz.title, 'with', quiz.players, 'players');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'Hard': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredQuizzes = filterPlayers === 'all' 
    ? quizOptions 
    : quizOptions.filter(quiz => quiz.players === filterPlayers);

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
            <h1 className="text-xl font-bold">Online Quiz Arena</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Challenge Your Knowledge</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Compete with fellow students in real-time quizzes. Test your knowledge and learn from others.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 bg-muted p-1 rounded-lg">
            <Button
              variant={filterPlayers === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterPlayers('all')}
            >
              All Quizzes
            </Button>
            <Button
              variant={filterPlayers === 2 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterPlayers(2)}
            >
              2 Players
            </Button>
            <Button
              variant={filterPlayers === 4 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterPlayers(4)}
            >
              4 Players
            </Button>
          </div>
        </div>

        {/* Quiz Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredQuizzes.map((quiz) => (
            <Card 
              key={quiz.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20"
              onClick={() => handleStartQuiz(quiz)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {quiz.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {quiz.players}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getDifficultyColor(quiz.difficulty)}`}
                        >
                          {quiz.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {quiz.description}
                </CardDescription>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Category:</span>
                    <Badge variant="secondary" className="text-xs">
                      {quiz.category}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Timer className="h-3 w-3 mr-1" />
                      Duration:
                    </span>
                    <span>{quiz.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Questions:</span>
                    <span>{quiz.questions}</span>
                  </div>
                </div>
                <Button className="w-full mt-4" size="sm">
                  Join Quiz
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quiz Matching Status */}
        {selectedQuiz && (
          <div className="mt-8 max-w-md mx-auto">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Finding Quiz Partners</CardTitle>
                <CardDescription>
                  Looking for {selectedQuiz.players} students to join {selectedQuiz.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground mb-4">
                  Matching you with students of similar skill level for a fair competition.
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedQuiz(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1"
                  >
                    Start Solo Practice
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

export default Quiz;