export interface GistFile {
  filename: string;
  content: string;
  language?: string;
  type?: string;
  raw_url?: string;
  size?: number;
}

export interface GistOwner {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

export interface Gist {
  id: string;
  description: string;
  public: boolean;
  created_at: string;
  updated_at: string;
  comments: number;
  comments_url: string;
  html_url: string;
  git_pull_url: string;
  git_push_url: string;
  url: string;
  files: Record<string, GistFile>;
  owner: GistOwner;
  truncated: boolean;
  stargazers_count?: number;
}

export interface GistFormFile {
  originalFilename?: string;
  filename: string;
  content: string;
  isDeleted?: boolean;
}

export interface GistStar {
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  starred_at: string;
}