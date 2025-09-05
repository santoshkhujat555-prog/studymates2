import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Question {
  question_id: string;
  question: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  correct_option: number;
  difficulty_level: string;
}

export default function QuestionUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const parseCSV = (csvText: string): Question[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const questions: Question[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
      
      if (columns.length >= 8) {
        const correctOption = parseInt(columns[6]);
        const difficultyLevel = columns[7].toLowerCase();
        
        if (correctOption >= 1 && correctOption <= 4 && 
            ['easy', 'medium', 'hard'].includes(difficultyLevel)) {
          questions.push({
            question_id: columns[0],
            question: columns[1],
            option_1: columns[2],
            option_2: columns[3],
            option_3: columns[4],
            option_4: columns[5],
            correct_option: correctOption,
            difficulty_level: difficultyLevel
          });
        }
      }
    }
    
    return questions;
  };

  const handleFileUpload = async () => {
    if (!file || !user) {
      toast({
        title: "Error",
        description: "Please select a file and ensure you're logged in",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const text = await file.text();
      const questions = parseCSV(text);

      if (questions.length === 0) {
        toast({
          title: "Error",
          description: "No valid questions found in the file",
          variant: "destructive"
        });
        setUploading(false);
        return;
      }

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const question of questions) {
        try {
          const { error } = await supabase
            .from('questions')
            .insert({
              ...question,
              created_by: user.id
            });

          if (error) {
            failedCount++;
            errors.push(`Question ${question.question_id}: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (err) {
          failedCount++;
          errors.push(`Question ${question.question_id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      setUploadResult({
        success: successCount,
        failed: failedCount,
        errors
      });

      if (successCount > 0) {
        toast({
          title: "Upload Complete",
          description: `Successfully uploaded ${successCount} questions`,
        });
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process the file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-6 w-6" />
              Upload Questions
            </CardTitle>
            <CardDescription>
              Upload a CSV file with quiz questions in the specified format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>CSV Format Required:</strong><br />
                Question ID, Question, Option 1, Option 2, Option 3, Option 4, Correct Option (1-4), Difficulty Level (easy/medium/hard)
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                />
              </div>

              <Button 
                onClick={handleFileUpload}
                disabled={!file || uploading}
                className="w-full"
              >
                {uploading ? "Uploading..." : "Upload Questions"}
              </Button>
            </div>

            {uploadResult && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {uploadResult.success > 0 && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>{uploadResult.success} questions uploaded successfully</span>
                      </div>
                    )}
                    {uploadResult.failed > 0 && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{uploadResult.failed} questions failed to upload</span>
                      </div>
                    )}
                    {uploadResult.errors.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-sm">Errors:</h4>
                        <div className="text-sm text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                          {uploadResult.errors.map((error, index) => (
                            <div key={index} className="text-red-600">{error}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-sm text-muted-foreground">
              <h4 className="font-semibold mb-2">Sample CSV format:</h4>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`Question ID,Question,Option 1,Option 2,Option 3,Option 4,Correct Option,Difficulty Level
Q001,What is 2+2?,2,3,4,5,3,easy
Q002,Capital of France?,London,Berlin,Paris,Madrid,3,medium`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}