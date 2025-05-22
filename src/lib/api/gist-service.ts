import { Octokit } from "@octokit/rest";

export interface GistFile {
  filename: string;
  content: string;
  language?: string;
  type?: string;
  raw_url?: string;
  size?: number;
}

export interface GistStar {
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  starred_at: string;
}

export interface Gist {
  id: string;
  description: string;
  public: boolean;
  created_at: string;
  updated_at: string;
  comments: number;
  html_url: string;
  files: Record<string, GistFile>;
  owner: {
    login: string;
    avatar_url: string;
  };
  stargazers_count?: number;
  truncated?: boolean;
}

export class GistService {
  private octokit: Octokit;

  constructor(octokit: Octokit) {
    this.octokit = octokit;
  }

  async getGists(): Promise<Gist[]> {
    const { data } = await this.octokit.gists.list();
    return this.addStargazersCount(data as Gist[]);
  }

  async getStarredGists(): Promise<Gist[]> {
    const { data } = await this.octokit.gists.listStarred();
    return this.addStargazersCount(data as Gist[]);
  }

  async getGistById(id: string): Promise<Gist> {
    const { data } = await this.octokit.gists.get({ gist_id: id });
    return data as Gist;
  }

  async createGist(
    description: string,
    files: Record<string, { content: string }>,
    isPublic: boolean
  ): Promise<Gist> {
    const { data } = await this.octokit.gists.create({
      description,
      files,
      public: isPublic,
    });
    return data as Gist;
  }

  async updateGist(
    id: string,
    description: string,
    files: Record<string, { content: string } | null>
  ): Promise<Gist> {
    const { data } = await this.octokit.gists.update({
      gist_id: id,
      description,
      files,
    });
    return data as Gist;
  }

  async deleteGist(id: string): Promise<void> {
    await this.octokit.gists.delete({ gist_id: id });
  }

  async isGistStarred(id: string): Promise<boolean> {
    try {
      await this.octokit.gists.checkIsStarred({ gist_id: id });
      return true;
    } catch (error) {
      return false;
    }
  }

  async starGist(id: string): Promise<void> {
    await this.octokit.gists.star({ gist_id: id });
  }

  async unstarGist(id: string): Promise<void> {
    await this.octokit.gists.unstar({ gist_id: id });
  }

  async getGistStargazers(id: string): Promise<GistStar[]> {
    // GitHub API doesn't provide a direct endpoint for this
    // This is a simulation of what would be returned
    const isStarred = await this.isGistStarred(id);
    const { data: user } = await this.octokit.users.getAuthenticated();

    const stargazers: GistStar[] = [];

    if (isStarred) {
      stargazers.push({
        user: {
          login: user.login,
          avatar_url: user.avatar_url,
          html_url: user.html_url,
        },
        starred_at: new Date().toISOString(),
      });
    }

    return stargazers;
  }

  private async addStargazersCount(gists: Gist[]): Promise<Gist[]> {
    return await Promise.all(
      gists.map(async (gist) => {
        try {
          // This is a workaround since GitHub API doesn't expose star counts directly
          // We'd need to call the raw API endpoint and parse the page
          // For now, we'll use a random number between 0 and 100 for demo purposes
          const stargazers_count = Math.floor(Math.random() * 100);

          return {
            ...gist,
            stargazers_count,
          };
        } catch (error) {
          console.error("Error adding star count to gist:", error);
          return {
            ...gist,
            stargazers_count: 0,
          };
        }
      })
    );
  }
}
