export interface WebsiteProps {
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
  description: string;
  disclaimer: string;
  id: string;
  imageUrl?: string;
  name: string;
  primaryColor?: string;
  secondaryColor?: string;
  url: string;
}
