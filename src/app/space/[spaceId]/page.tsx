import SpaceDetail from "@/components/space/SpaceDetail";
import { communityService } from "@/lib/firebase/communityService";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SpaceStandalonePage(props: { params: Promise<{ spaceId: string }> }) {
  const params = await props.params;
  const spaceId = params.spaceId;
  
  try {
    const community = await communityService.getCommunity(spaceId);
    
    if (!community) {
      notFound();
    }
    
    return <SpaceDetail community={community} />;
  } catch (error) {
    console.error(`Error loading space ${spaceId}:`, error);
    // Return a graceful error UI instead of crashing the whole server
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
        </div>
        <h1 className="text-2xl font-black text-on-surface mb-2">공간 정보를 불러올 수 없습니다</h1>
        <p className="text-on-surface-variant max-w-sm mb-8">
          데이터를 가져오는 중 문제가 발생했습니다. 일시적인 오류일 수 있으니 잠시 후 다시 시도해 주세요.
        </p>
        <a 
          href="" 
          className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold hover:opacity-90 transition-all inline-block"
        >
          다시 시도
        </a>
      </div>
    );
  }
}
