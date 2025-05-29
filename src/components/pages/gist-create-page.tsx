import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  FileCode, 
  Plus, 
  X, 
  Save, 
  ArrowLeft, 
  AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/auth-provider';
import { GistService } from '@/lib/api/gist-service';

const gistFormSchema = z.object({
  description: z.string().optional(),
  public: z.boolean().default(true),
  files: z.array(
    z.object({
      filename: z.string().min(1, {
        message: 'Filename is required',
      }),
      content: z.string().min(1, {
        message: 'Content is required',
      }),
    })
  ).min(1, {
    message: 'At least one file is required',
  }),
});

type GistFormValues = z.infer<typeof gistFormSchema>;

const defaultValues: Partial<GistFormValues> = {
  description: '',
  public: true,
  files: [
    { filename: '', content: '' },
  ],
};

export default function GistCreatePage() {
  const { octokit } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<GistFormValues>({
    resolver: zodResolver(gistFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    name: 'files',
    control: form.control,
  });

  const onSubmit = async (data: GistFormValues) => {
    if (!octokit) return;

    try {
      setIsSubmitting(true);
      setError(null);
      
      const gistService = new GistService(octokit);
      
      // Convert files array to GitHub API format
      const filesObj: Record<string, { content: string }> = {};
      data.files.forEach((file) => {
        filesObj[file.filename] = { content: file.content };
      });
      
      const newGist = await gistService.createGist(
        data.description || '',
        filesObj,
        data.public
      );
      
      toast({
        title: 'Gist created successfully',
      });
      
      navigate(`/gists/${newGist.id}`);
    } catch (err) {
      console.error('Error creating gist:', err);
      setError('Failed to create gist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addNewFile = () => {
    append({ filename: '', content: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Gist</h1>
          <p className="text-muted-foreground mt-2">
            Create a new gist to share code snippets, notes, or ideas.
          </p>
        </div>
        <Button 
          variant="outline" 
          asChild
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </motion.div>
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gist Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter a description for your gist (optional)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description helps others understand what your gist is about.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="public"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Public Gist</FormLabel>
                          <FormDescription>
                            Public gists are visible to everyone. Private gists are only visible to you.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Files</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewFile}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add File</span>
                </Button>
              </div>

              {fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-medium">File {index + 1}</h3>
                        </div>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove file</span>
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-4">
                        <FormField
                          control={form.control}
                          name={`files.${index}.filename`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Filename</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., script.js, notes.md"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Include the file extension to help with syntax highlighting.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`files.${index}.content`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content</FormLabel>
                              <FormControl>
                                <Textarea
                                  rows={10}
                                  placeholder="Enter your code or text here"
                                  className="font-mono text-sm"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center gap-1"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Create Gist</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}