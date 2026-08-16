export interface Project {
  id: string;
  title: string;
  description: string;
  homepageUrl: string | null;
  githubRepo: string;
  languages: string[];
  topics: string[];
  techKeywords: string[];
  purposeKeywords: string[];
}
