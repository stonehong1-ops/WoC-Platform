'use client';

import { useParams, useRouter } from 'next/navigation';
import AiLessonThread from '@/components/lesson/AiLessonThread';

export default function AiLessonThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params?.id as string;

  return <AiLessonThread threadId={threadId} onClose={() => router.back()} />;
}
