export type UserSummary = {
  id: number;
  full_name: string;
  affiliation: string;
};
 
export interface Project {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  url?: string;
}
 
export type ProjectListResponse = {
  items: Project[];
  total: number;
  page: number;
  page_size: number;
};
 
export interface CreateProjectPayload {
  title: string;
  description?: string;
  url?: string;
}
 
export interface UpdateProjectPayload {
  title?: string;
  description?: string;
  url?: string;
}