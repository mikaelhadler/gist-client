import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  prism,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";
import {
  Pencil,
  Trash,
  Star,
  ExternalLink,
  Copy,
  Check,
  File,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth/auth-provider";
import { GistService, Gist } from "@/lib/api/gist-service";
import { useTheme } from "@/components/theme-provider";

export default function GistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { octokit } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [gist, setGist] = useState<Gist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>(
    {}
  );

  const syntaxTheme = theme === "dark" ? vscDarkPlus : prism;

  useEffect(() => {
    const fetchGist = async () => {
      if (!octokit || !id) return;

      try {
        setIsLoading(true);
        setError(null);

        const gistService = new GistService(octokit);
        const gistData = await gistService.getGistById(id);

        setGist(gistData);

        // Initialize all files as expanded
        const initialExpanded: Record<string, boolean> = {};
        Object.keys(gistData.files).forEach((filename) => {
          initialExpanded[filename] = true;
        });
        setExpandedFiles(initialExpanded);
      } catch (err) {
        console.error("Error fetching gist:", err);
        setError(
          "Failed to load gist. It may have been deleted or you may not have permission to view it."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchGist();
  }, [octokit, id]);

  const handleDeleteGist = async () => {
    if (!octokit || !id) return;

    try {
      setIsDeleting(true);
      const gistService = new GistService(octokit);
      await gistService.deleteGist(id);
      toast({
        title: "Gist deleted successfully",
      });
      navigate("/gists");
    } catch (error) {
      console.error("Error deleting gist:", error);
      toast({
        variant: "destructive",
        title: "Failed to delete gist",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  const handleCopyContent = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const toggleFileExpand = (filename: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [filename]: !prev[filename],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !gist) {
    return (
      <Alert variant="destructive" className="mt-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || "Gist not found"}</AlertDescription>
      </Alert>
    );
  }

  const fileEntries = Object.entries(gist.files);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {gist.description || "Untitled Gist"}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Avatar className="h-6 w-6">
              <AvatarImage src={gist.owner.avatar_url} alt={gist.owner.login} />
              <AvatarFallback>
                {gist.owner.login.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{gist.owner.login}</span>
            <span>•</span>
            <span>
              Created {formatDistanceToNow(new Date(gist.created_at))} ago
            </span>
            <span>•</span>
            <span>
              Updated {formatDistanceToNow(new Date(gist.updated_at))} ago
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href={gist.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open in GitHub</span>
            </a>
          </Button>

          <Button variant="outline" size="sm" asChild>
            <Link to={`/gists/${id}/edit`} className="flex items-center gap-1">
              <Pencil className="h-4 w-4" />
              <span>Edit</span>
            </Link>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteAlert(true)}
            className="flex items-center gap-1"
          >
            <Trash className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {gist.public ? (
          <Badge variant="outline">Public</Badge>
        ) : (
          <Badge variant="outline" className="bg-muted">
            Private
          </Badge>
        )}
        <Badge variant="secondary" className="flex items-center gap-1">
          <Star className="h-3 w-3" />
          <span>{gist.stargazers_count || 0}</span>
        </Badge>
        <Badge variant="secondary">
          {fileEntries.length} file{fileEntries.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <Tabs defaultValue="code" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="code" className="flex-1 sm:flex-initial">
            Code
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex-1 sm:flex-initial">
            Preview
          </TabsTrigger>
          <TabsTrigger value="details" className="flex-1 sm:flex-initial">
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="mt-4 space-y-4">
          {fileEntries.map(([filename, file], index) => (
            <motion.div
              key={filename}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden">
                <div className="bg-secondary/50 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{filename}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCopyContent(filename, file.content)}
                    >
                      {copiedFile === filename ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="sr-only">Copy code</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleFileExpand(filename)}
                    >
                      {expandedFiles[filename] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <span className="sr-only">Toggle expand</span>
                    </Button>
                  </div>
                </div>
                <AnimatePresence>
                  {expandedFiles[filename] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardContent className="p-0">
                        <SyntaxHighlighter
                          language={file.language?.toLowerCase() || "text"}
                          style={syntaxTheme}
                          customStyle={{
                            margin: 0,
                            borderRadius: 0,
                            fontSize: "0.9rem",
                            maxHeight: "400px",
                          }}
                        >
                          {file.content}
                        </SyntaxHighlighter>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <div className="space-y-4">
            {fileEntries.map(([filename, file]) => {
              // Only show preview for Markdown files
              if (file.language?.toLowerCase() === "markdown") {
                return (
                  <motion.div
                    key={filename}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <div className="bg-secondary/50 px-4 py-2">
                        <span className="font-medium">{filename}</span>
                      </div>
                      <CardContent className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{file.content}</ReactMarkdown>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              }
              return null;
            })}
            {!fileEntries.some(
              ([_, file]) => file.language?.toLowerCase() === "markdown"
            ) && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <File className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No preview available</h3>
                <p className="text-muted-foreground mt-1">
                  This gist doesn't contain any Markdown files to preview
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="gist-info">
                  <AccordionTrigger>Gist Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="font-medium">Created</div>
                        <div className="col-span-2">
                          {format(new Date(gist.created_at), "PPpp")}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="font-medium">Last Updated</div>
                        <div className="col-span-2">
                          {format(new Date(gist.updated_at), "PPpp")}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="font-medium">Visibility</div>
                        <div className="col-span-2">
                          {gist.public ? "Public" : "Private"}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="font-medium">Stars</div>
                        <div className="col-span-2">
                          {gist.stargazers_count || 0}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="font-medium">Files</div>
                        <div className="col-span-2">{fileEntries.length}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="font-medium">URL</div>
                        <div className="col-span-2 break-all">
                          <a
                            href={gist.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {gist.html_url}
                          </a>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="owner-info">
                  <AccordionTrigger>Owner Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={gist.owner.avatar_url}
                          alt={gist.owner.login}
                        />
                        <AvatarFallback>
                          {gist.owner.login.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-lg">
                          {gist.owner.login}
                        </h3>
                        <a
                          href={`https://github.com/${gist.owner.login}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm flex items-center gap-1"
                        >
                          <span>View on GitHub</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="file-details">
                  <AccordionTrigger>File Details</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {fileEntries.map(([filename, file]) => (
                        <div key={filename} className="border rounded-md p-4">
                          <div className="font-medium mb-2">{filename}</div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="text-muted-foreground">
                              Language
                            </div>
                            <div className="col-span-2">
                              {file.language || "Plain Text"}
                            </div>

                            <div className="text-muted-foreground">Size</div>
                            <div className="col-span-2">{file.size} bytes</div>

                            <div className="text-muted-foreground">Type</div>
                            <div className="col-span-2">
                              {file.type || "Unknown"}
                            </div>

                            {file.raw_url && (
                              <>
                                <div className="text-muted-foreground">
                                  Raw URL
                                </div>
                                <div className="col-span-2 truncate">
                                  <a
                                    href={file.raw_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    View Raw
                                  </a>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this gist?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              gist and all its contents from GitHub.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGist}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
