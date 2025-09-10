                          import React, { useState, useEffect, createContext, useContext } from 'react';
import { ArrowLeft, Heart, X, MapPin, BookOpen, GraduationCap } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection } from 'firebase/firestore';

// Tailwind CSS is assumed to be available.
// All components are in a single file to make it a self-contained app.

// Mock UI components from a library like Shadcn UI
const MockButton = ({ children, ...props }) => <button {...props} className={`p-2 rounded-md ${props.className}`}>{children}</button>;
const MockCard = ({ children, ...props }) => <div {...props} className={`rounded-lg shadow-md bg-white ${props.className}`}>{children}</div>;

// --- Firebase and Auth Context Setup ---

const AuthContext = createContext(null);

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

    const app = initializeApp(firebaseConfig);
    const authInstance = getAuth(app);
    const dbInstance = getFirestore(app);
    setDb(dbInstance);

    const checkAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined') {
          await signInWithCustomToken(authInstance, __initial_auth_token);
        } else {
          await signInAnonymously(authInstance);
        }
        const currentUser = authInstance.currentUser;
        setUser(currentUser);
        setUserId(currentUser.uid);
        console.log("Firebase initialized and user signed in:", currentUser.uid);
      } catch (error) {
        console.error("Firebase Auth Error:", error);
      }
    };

    checkAuth();

    return () => {
      // Clean up listeners if any
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userId, db }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Mock Profile Match Hook and Data ---

const mockProfiles = [
  { user_id: 'user1', full_name: 'Alex Johnson', university_name: 'Tech University', bio: 'Passionate about AI and machine learning.', branch_course: 'Computer Science', skills: ['Python', 'Java', 'Data Science'], interests: ['Gaming', 'Hiking'] },
  { user_id: 'user2', full_name: 'Sarah Lee', university_name: 'State College', bio: 'Looking for a study buddy for organic chemistry.', branch_course: 'Chemistry', skills: ['Organic Chemistry', 'Lab Skills'], interests: ['Reading', 'Cooking'] },
  { user_id: 'user3', full_name: 'Michael Chen', university_name: 'Design Institute', bio: 'Let\'s collaborate on a UI/UX project!', branch_course: 'Graphic Design', skills: ['Figma', 'Sketch', 'Photoshop'], interests: ['Photography', 'Music'] },
  { user_id: 'user4', full_name: 'Emily Davis', university_name: 'Engineering School', bio: 'Need a partner for my senior engineering project.', branch_course: 'Mechanical Engineering', skills: ['CAD', 'Thermodynamics'], interests: ['Running', 'Travel'] },
];

const useProfileMatch = () => {
  const { userId, db } = useAuth();
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    // In a real app, this would fetch profiles from Firestore
    // For this mock, we ensure the current user's ID is not in the list
    const filteredProfiles = mockProfiles.filter(p => p.user_id !== userId);
    setProfiles(filteredProfiles);
    setLoading(false);
    loadNextProfile(filteredProfiles);
  }, [userId]);

  const loadNextProfile = (profileList = profiles) => {
    const nextProfile = profileList.shift();
    if (nextProfile) {
      setCurrentProfile(nextProfile);
    } else {
      setCurrentProfile(null);
    }
  };

  const likeProfile = async (likedUserId) => {
    if (!userId || !db) {
      console.error("User or database not ready.");
      return;
    }

    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const likesCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'likes');
      const docId = `${userId}_${likedUserId}`;
      const mutualDocId = `${likedUserId}_${userId}`;
      const mutualDocRef = doc(likesCollectionRef, mutualDocId);
      const mutualDocSnap = await getDoc(mutualDocRef);

      if (mutualDocSnap.exists()) {
        console.log("Mutual like found! Creating friendship.");
        await setDoc(mutualDocRef, {
          user1_id: likedUserId,
          user2_id: userId,
          status: 'matched',
          timestamp: new Date()
        }, { merge: true });
        // Use a basic alert for now, since custom modals are not supported
        window.alert('It\'s a match! You are now friends!');
      } else {
        console.log("Adding like to database.");
        await setDoc(doc(likesCollectionRef, docId), {
          user_id: userId,
          liked_user_id: likedUserId,
          status: 'pending',
          timestamp: new Date()
        });
        window.alert('Profile liked! They will be notified.');
      }
      
      loadNextProfile();
    } catch (e) {
      console.error("Error liking profile:", e);
    }
  };

  const passProfile = (passedUserId) => {
    console.log(`User ${userId} passed on user ${passedUserId}`);
    loadNextProfile();
  };

  return { currentProfile, loadNextProfile, likeProfile, passProfile, loading };
};

// --- Main App Component ---

const App = () => {
  return (
    <AuthProvider>
      <ProfileMatchComponent />
    </AuthProvider>
  );
};

const ProfileMatchComponent = () => {
  const { user, userId, db } = useAuth();
  const { currentProfile, likeProfile, passProfile, loading } = useProfileMatch();
  
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [page, setPage] = useState('match');

  useEffect(() => {
    if (user !== null) {
      setIsAuthReady(true);
    }
  }, [user]);

  // Framer Motion values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold && currentProfile) {
      likeProfile(currentProfile.user_id);
    } else if (info.offset.x < -threshold && currentProfile) {
      passProfile(currentProfile.user_id);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Initializing...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading profiles...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 font-sans">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <MockButton onClick={() => setPage('home')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </MockButton>
          <h1 className="text-xl font-bold">StudyMates</h1>
          <div className="w-16" />
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8 max-w-md">
        {currentProfile ? (
          <div className="relative">
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              style={{ x, rotate, opacity }}
              onDragEnd={handleDragEnd}
            >
              <MockCard className="overflow-hidden bg-card border-2">
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
                        {currentProfile.skills.slice(0, 3).map((skill, idx) => (
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
              </MockCard>
            </motion.div>
            <div className="flex justify-center space-x-8 mt-6">
              <MockButton
                aria-label="Pass profile"
                className="rounded-full h-14 w-14 border-2 border-red-200 hover:bg-red-50"
                onClick={() => {
                  if (currentProfile) {
                    passProfile(currentProfile.user_id);
                  }
                }}
              >
                <X className="h-6 w-6 text-red-500" />
              </MockButton>
              <MockButton
                aria-label="Like profile"
                className="rounded-full h-14 w-14 border-2 border-green-200 hover:bg-green-50"
                onClick={() => {
                  if (currentProfile) {
                    likeProfile(currentProfile.user_id);
                  }
                }}
              >
                <Heart className="h-6 w-6 text-green-500" />
              </MockButton>
            </div>
          </div>
        ) : (
          <MockCard className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">No more profiles</h3>
            <p className="text-muted-foreground mb-6">
              Check back later for more study partners!
            </p>
            <MockButton onClick={() => setPage('home')}>Back to Home</MockButton>
          </MockCard>
        )}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Your User ID: <span className="font-mono text-xs">{userId}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
