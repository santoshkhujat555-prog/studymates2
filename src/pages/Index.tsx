import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { GraduationCap, Users, BookOpen, MessageCircle, LogOut, Heart } from 'lucide-react';

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center space-y-6 p-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/lovable-uploads/b961a5a2-1ea8-4ae2-a004-5695fca1bd1f.png" 
              alt="StudyMates Logo" 
              className="h-16 w-16 mr-4"
            />
            <h1 className="text-5xl font-bold">StudyMates</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-md">
            Connect with fellow students, share knowledge, and enhance your learning journey
          </p>
          <Button onClick={() => navigate('/auth')} size="lg" className="mt-6">
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/b961a5a2-1ea8-4ae2-a004-5695fca1bd1f.png" 
              alt="StudyMates Logo" 
              className="h-10 w-10 mr-3"
            />
            <h1 className="text-2xl font-bold">StudyMates</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Welcome back!</span>
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
              <Users className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-lg text-muted-foreground">
            Choose from our study categories and connect with like-minded students
          </p>
        </div>

        {/* Profile Matching Section - At Top */}
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-primary">Find Study Partners</h3>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Discover and connect with fellow students through our matching system
            </p>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-24 flex-col max-w-sm mx-auto w-full"
              onClick={() => navigate('/profile-match')}
            >
              <Heart className="h-8 w-8 mb-2" />
              <span className="font-semibold text-lg">Profile Matching</span>
              <span className="text-sm text-muted-foreground">Swipe to find study buddies</span>
            </Button>
          </div>

          <h3 className="text-xl font-semibold">Other Learning Activities</h3>
          
          {/* Create Lobby Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-primary">Create Study Lobby</h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Get matched with students who share your academic interests and goals
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Button 
                variant="outline" 
                size="lg" 
                className="h-20 flex-col"
                onClick={() => navigate('/lobby')}
              >
                <Users className="h-6 w-6 mb-2" />
                <span className="font-semibold">2 Player Match</span>
                <span className="text-sm text-muted-foreground">Find a study buddy</span>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="h-20 flex-col"
                onClick={() => navigate('/lobby')}
              >
                <Users className="h-6 w-6 mb-2" />
                <span className="font-semibold">4 Player Group</span>
                <span className="text-sm text-muted-foreground">Join a study group</span>
              </Button>
            </div>
          </div>

          {/* Online Quiz Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-primary">Online Quiz Arena</h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Challenge yourself and compete with other students in real-time quizzes
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Button 
                variant="outline" 
                size="lg" 
                className="h-20 flex-col"
                onClick={() => navigate('/quiz')}
              >
                <GraduationCap className="h-6 w-6 mb-2" />
                <span className="font-semibold">2 Player Quiz</span>
                <span className="text-sm text-muted-foreground">Head-to-head challenge</span>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="h-20 flex-col"
                onClick={() => navigate('/quiz')}
              >
                <GraduationCap className="h-6 w-6 mb-2" />
                <span className="font-semibold">4 Player Quiz</span>
                <span className="text-sm text-muted-foreground">Group competition</span>
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-card p-6 rounded-lg border text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">Connect with Friend</h3>
              <p className="text-sm text-muted-foreground">Match with students who share your interests</p>
            </div>
            <div className="bg-card p-6 rounded-lg border text-center">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">Share Resources</h3>
              <p className="text-sm text-muted-foreground">Upload and download study materials</p>
            </div>
            <div className="bg-card p-6 rounded-lg border text-center">
              <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">Join Discussion</h3>
              <p className="text-sm text-muted-foreground">Participate in subject-wise forums</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
