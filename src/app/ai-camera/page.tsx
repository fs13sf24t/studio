
import AICameraView from '@/components/ai-camera/ai-camera-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Camera - ShortsFlow',
  description: 'AI-powered camera with object detection.',
};

export default function AICameraPage() {
  return (
    <main className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground">
      <AICameraView />
    </main>
  );
}
