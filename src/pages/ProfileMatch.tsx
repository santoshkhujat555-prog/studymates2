import { useEffect } from 'react'; import { useNavigate } from 'react-router-dom'; import { Button } from '@/components/ui/button'; import { Card } from '@/components/ui/card'; import { useAuth } from '@/hooks/useAuth'; import { useProfileMatch } from '@/hooks/useProfileMatch'; import { ArrowLeft, Heart, X, MapPin, BookOpen, GraduationCap } from 'lucide-react'; import { motion, useMotionValue, useTransform } from 'framer-motion';

const ProfileMatch = () => { const { user } = useAuth(); const navigate = useNavigate(); const { currentProfile, loadNextProfile, likeProfile, passProfile, loading } = useProfileMatch();

useEffect(() => { if (!user) navigate('/auth'); }, [user, navigate]);

// Framer Motion values const x = useMotionValue(0); const rotate = useTransform(x, [-200, 200], [-15, 15]); const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

const handleDragEnd = (_: any, info: any) => { const threshold = 100; if (info.offset.x > threshold && currentProfile) { likeProfile(currentProfile.user_id); loadNextProfile(); } else if (info.offset.x < -threshold && currentProfile) { passProfile(currentProfile.user_id); loadNextProfile(); } };

if (loading) { return ( <div className="min-h-screen flex flex-col items-center justify-center bg-background"> <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div> <p className="text-muted-foreground">Loading profiles...</p> </div> ); }

return ( <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5"> {/* Header */} <header className="bg-card border-b px-4 py-3"> <div className="flex items-center justify-between max-w-md mx-auto"> <Button variant="ghost" size="sm" onClick={() => navigate('/')}> <ArrowLeft className="h-4 w-4 mr-2" /> Back </Button> <h1 className="text-xl font-bold">StudyMates</h1> <div className="w-16" /> </div> </header>

{/* Main Content */}
  <div className="container mx-auto px-4 py-8 max-w-md">
    {currentProfile ? (
      <div className="relative">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          style={{ x, rotate, opacity }}
          onDragEnd={handleDragEnd}
        >
          <Card className="overflow-hidden bg-card border-2">
            {/* Profile Image */}
            <div className="h-96 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              {currentProfile.avatar_url ? (
                <img
                  src={currentProfile.avatar_url}
                  alt={currentProfile.full_name || 'Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentProfile.full_name || 'User')}&background=random`}
                  alt="Default Avatar"
                  className="w-32 h-32 rounded-full object-cover"
                />
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

              {currentProfile.skills?.length > 0 && (
                <div>
                  <div className="flex items-center text-muted-foreground mb-2">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.skills.slice(0, 3).map((skill: string, idx: number) => (
                      <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentProfile.interests?.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Interests: </span>
                  <span className="text-sm text-foreground">
                    {currentProfile.interests.slice(0, 2).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-8 mt-6">
          <Button
            variant="outline"
            size="lg"
            aria-label="Pass profile"
            className="rounded-full h-14 w-14 border-2 border-red-200 hover:bg-red-50"
            onClick={() => {
              if (currentProfile) {
                passProfile(currentProfile.user_id);
                loadNextProfile();
              }
            }}
          >
            <X className="h-6 w-6 text-red-500" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            aria-label="Like profile"
            className="rounded-full h-14 w-14 border-2 border-green-200 hover:bg-green-50"
            onClick={() => {
              if (currentProfile) {
                likeProfile(currentProfile.user_id);
                loadNextProfile();
              }
            }}
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
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </Card>
    )}
  </div>
</div>

); };

export default ProfileMatch;

