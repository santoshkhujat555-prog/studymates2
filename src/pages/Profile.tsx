import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Settings, Camera, Copy, Check } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  bio: string | null;
  avatar_url: string | null;
  university_name: string | null;
  branch_course: string | null;
  skills: string[] | null;
  competitive_exam: string | null;
  career_goal: string | null;
  visibility: boolean | null;
  mobile_number: string | null;
  user_code: string | null;
}

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    mobile_number: '',
    university_name: '',
    branch_course: '',
    skills: '',
    competitive_exam: '',
    career_goal: '',
    visibility: true,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
      return;
    }

    if (data) {
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        bio: data.bio || '',
        mobile_number: data.mobile_number || '',
        university_name: data.university_name || '',
        branch_course: data.branch_course || '',
        skills: data.skills?.join(', ') || '',
        competitive_exam: data.competitive_exam || '',
        career_goal: data.career_goal || '',
        visibility: data.visibility ?? true,
      });
    } else {
      // Profile doesn't exist, enable editing mode
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    
    const skillsArray = formData.skills
      ? formData.skills.split(',').map(s => s.trim()).filter(s => s)
      : [];

    const profileData = {
      user_id: user.id,
      full_name: formData.full_name,
      email: user.email,
      bio: formData.bio,
      mobile_number: formData.mobile_number,
      university_name: formData.university_name,
      branch_course: formData.branch_course,
      skills: skillsArray,
      competitive_exam: formData.competitive_exam,
      career_goal: formData.career_goal,
      visibility: formData.visibility,
    };

    const { error } = profile
      ? await supabase
          .from('profiles')
          .update(profileData)
          .eq('user_id', user.id)
      : await supabase
          .from('profiles')
          .insert(profileData);

    if (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Profile saved successfully"
      });
      setIsEditing(false);
      fetchProfile();
    }

    setIsSaving(false);
  };

  const copyUserCode = async () => {
    if (profile?.user_code) {
      await navigator.clipboard.writeText(profile.user_code);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Your user code has been copied to clipboard"
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img 
              src="/lovable-uploads/b961a5a2-1ea8-4ae2-a004-5695fca1bd1f.png" 
              alt="StudyMates Logo" 
              className="h-8 w-8 mr-2"
            />
            <h1 className="text-xl font-bold">Profile</h1>
          </div>
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <Settings className="h-4 w-4 mr-2" /> : <User className="h-4 w-4 mr-2" />}
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex flex-col items-center mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                {isEditing && (
                  <Button size="sm" variant="secondary" className="absolute -bottom-2 -right-2 rounded-full p-2">
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CardTitle className="mt-4">
                {isEditing ? (
                  <Input
                    placeholder="Full Name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="text-center text-xl font-bold"
                  />
                ) : (
                  profile?.full_name || 'Add your name'
                )}
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* User Code Section */}
            {profile?.user_code && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h3 className="text-sm font-medium text-primary mb-2">Your User Code</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Share this 6-digit code with friends to invite them to quiz lobbies
                </p>
                <div className="flex items-center justify-between bg-background rounded-md p-3 border">
                  <code className="text-2xl font-mono font-bold tracking-wider text-primary">
                    {profile.user_code}
                  </code>
                  <Button variant="outline" size="sm" onClick={copyUserCode}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                {isEditing ? (
                  <Input
                    id="mobile"
                    placeholder="Mobile Number"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile?.mobile_number || 'Add mobile number'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile?.bio || 'Add a bio'}
                  </p>
                )}
              </div>
            </div>

            {/* Academic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Academic Information</h3>
              
              <div>
                <Label htmlFor="university">University / Institute Name</Label>
                {isEditing ? (
                  <Input
                    id="university"
                    placeholder="University / Institute Name"
                    value={formData.university_name}
                    onChange={(e) => setFormData({ ...formData, university_name: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile?.university_name || 'Add university/institute'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="branch">Branch / Course</Label>
                {isEditing ? (
                  <Input
                    id="branch"
                    placeholder="Branch / Course"
                    value={formData.branch_course}
                    onChange={(e) => setFormData({ ...formData, branch_course: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile?.branch_course || 'Add branch/course'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="skills">Skills / Hobbies</Label>
                {isEditing ? (
                  <Input
                    id="skills"
                    placeholder="Skills / Hobbies (comma separated)"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  />
                ) : (
                  <div className="mt-1">
                    {profile?.skills && profile.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Add your skills/hobbies</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="exam">Competitive Exam</Label>
                {isEditing ? (
                  <Input
                    id="exam"
                    placeholder="Competitive Exam"
                    value={formData.competitive_exam}
                    onChange={(e) => setFormData({ ...formData, competitive_exam: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile?.competitive_exam || 'Add competitive exam'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="career">Career Goal</Label>
                {isEditing ? (
                  <Input
                    id="career"
                    placeholder="Career Goal"
                    value={formData.career_goal}
                    onChange={(e) => setFormData({ ...formData, career_goal: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile?.career_goal || 'Add career goal'}
                  </p>
                )}
              </div>
            </div>

            {/* Privacy */}
            {isEditing && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Privacy Settings</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visibility"
                    checked={formData.visibility}
                    onCheckedChange={(checked) => setFormData({ ...formData, visibility: !!checked })}
                  />
                  <Label htmlFor="visibility">Make profile visible to other students</Label>
                </div>
              </div>
            )}

            {/* Save Button */}
            {isEditing && (
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;