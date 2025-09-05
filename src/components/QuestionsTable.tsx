import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Question {
  id: string;
  question_id: string | null;
  question: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  correct_option: number;
  difficulty_level: string;
  created_at: string;
  created_by: string | null;
}

export default function QuestionsTable() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setQuestions(questions.filter(q => q.id !== id));
      toast({
        title: "Success",
        description: "Question deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCorrectOptionText = (question: Question) => {
    switch (question.correct_option) {
      case 1: return question.option_1;
      case 2: return question.option_2;
      case 3: return question.option_3;
      case 4: return question.option_4;
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Questions Database</h2>
        <Badge variant="outline">
          {questions.length} Total Questions
        </Badge>
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No questions uploaded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {questions.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">
                      {question.question_id && (
                        <span className="text-sm text-muted-foreground mr-2">
                          {question.question_id}:
                        </span>
                      )}
                      {question.question}
                    </CardTitle>
                    <div className="flex gap-2 items-center">
                      <Badge className={getDifficultyColor(question.difficulty_level)}>
                        {question.difficulty_level}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Added {new Date(question.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedQuestion(
                        selectedQuestion?.id === question.id ? null : question
                      )}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {user?.id === question.created_by && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {selectedQuestion?.id === question.id && (
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className={`p-3 rounded border ${question.correct_option === 1 ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                        <span className="font-medium">A) </span>{question.option_1}
                        {question.correct_option === 1 && <span className="text-green-600 ml-2">✓ Correct</span>}
                      </div>
                      <div className={`p-3 rounded border ${question.correct_option === 2 ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                        <span className="font-medium">B) </span>{question.option_2}
                        {question.correct_option === 2 && <span className="text-green-600 ml-2">✓ Correct</span>}
                      </div>
                      <div className={`p-3 rounded border ${question.correct_option === 3 ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                        <span className="font-medium">C) </span>{question.option_3}
                        {question.correct_option === 3 && <span className="text-green-600 ml-2">✓ Correct</span>}
                      </div>
                      <div className={`p-3 rounded border ${question.correct_option === 4 ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                        <span className="font-medium">D) </span>{question.option_4}
                        {question.correct_option === 4 && <span className="text-green-600 ml-2">✓ Correct</span>}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <strong>Correct Answer:</strong> Option {question.correct_option} - {getCorrectOptionText(question)}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}