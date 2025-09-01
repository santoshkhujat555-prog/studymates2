import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useProfileMatch } from '@/hooks/useProfileMatch';
import { ArrowLeft, Heart, X, MapPin, BookOpen, GraduationCap } from 'lucide-react';

const ProfileMatch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentProfile, loadNextProfile, likeProfile, passProfile, loading } = useProfileMatch();
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setDragPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const threshold = 100;
    
    if (dragPosition.x > threshold) {
      // Swiped right - like
      handleLike();
    } else if (dragPosition.x < -threshold) {
      // Swiped left - pass
      handlePass();
    }
    
    // Reset position
    setIsDragging(false);
    setDragPosition({ x: 0, y: 0 });
  };

  const handleLike = () => {
    if (currentProfile) {
      likeProfile(currentProfile.user_id);
    }
  };

  const handlePass = () => {
    if (currentProfile) {
      passProfile(currentProfile.user_id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const cardStyle = {
    transform: `translate(${dragPosition.x}px, ${dragPosition.y}px) rotate(${dragPosition.x * 0.1}deg)`,
    opacity: isDragging ? 0.8 : 1,
    transition: isDragging ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
  };

  const getSwipeIndicator = () => {
    if (!isDragging) return null;
    
    if (dragPosition.x > 50) {
      return (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg font-bold transform rotate-12">
          LIKE
        </div>
      );
    } else if (dragPosition.x < -50) {
      return (
        <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg font-bold transform -rotate-12">
          PASS
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold">StudyMates</h1>
          <div className="w-16" /> {/* Spacer */}
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-md">
        {currentProfile ? (
          <div className="relative">
            <Card 
              className="relative overflow-hidden bg-card border-2 cursor-grab active:cursor-grabbing"
              style={cardStyle}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {getSwipeIndicator()}
              
              {/* Profile Image */}
              <div className="h-96 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                {currentProfile.avatar_url ? (
                  <img 
                    src={currentProfile.avatar_url} 
                    alt={currentProfile.full_name || 'Profile'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-6xl font-bold text-primary/50">
                    {(currentProfile.full_name || 'User')[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {currentProfile.full_name || 'Anonymous User'}
                  </h2>
                  {currentProfile.university_name && (
                    <div className="flex items-center text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{currentProfile.university_name}</span>
                    </div>
                  )}
                </div>

                {currentProfile.bio && (
                  <p className="text-muted-foreground">{currentProfile.bio}</p>
                )}

                {currentProfile.branch_course && (
                  <div className="flex items-center text-muted-foreground">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    <span className="text-sm">{currentProfile.branch_course}</span>
                  </div>
                )}

                {currentProfile.skills && currentProfile.skills.length > 0 && (
                  <div>
                    <div className="flex items-center text-muted-foreground mb-2">
                      <BookOpen className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Skills</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.skills.slice(0, 3).map((skill, index) => (
                        <span 
                          key={index}
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {currentProfile.interests && currentProfile.interests.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Interests: </span>
                    <span className="text-sm text-foreground">
                      {currentProfile.interests.slice(0, 2).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-8 mt-6">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full h-14 w-14 border-2 border-red-200 hover:bg-red-50"
                onClick={handlePass}
              >
                <X className="h-6 w-6 text-red-500" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full h-14 w-14 border-2 border-green-200 hover:bg-green-50"
                onClick={handleLike}
              >
                <Heart className="h-6 w-6 text-green-500" />
              </Button>
            </div>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">No more profiles</h3>
            <p className="text-muted-foreground mb-6">
              Check back later for more study partners!
            </p>
            <Button onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfileMatch;