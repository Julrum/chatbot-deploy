export type ChildMessageProps = {
  content: string;
  imageUrl?: string;
  role: "assistant" | "user";
  title?: string;
  url?: string;
};

export interface MessageProps {
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
  children: ChildMessageProps[];
  id: string;
}
