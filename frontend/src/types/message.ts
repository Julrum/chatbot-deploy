export type ChildMessageProps = {
  content: string;
  imageUrl?: string;
  title?: string;
  url?: string;
};

export interface MessageProps {
  createdAt: string;
  children: ChildMessageProps[];
  id: string;
  role: "assistant" | "user";
}
