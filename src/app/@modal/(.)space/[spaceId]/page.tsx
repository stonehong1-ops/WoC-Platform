import SpaceModalContainer from "@/components/space/SpaceModalContainer";
import SpaceDetail from "@/components/space/SpaceDetail";
import { communityService } from "@/lib/firebase/communityService";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function InterceptedSpacePage(props: { params: Promise<{ spaceId: string }> }) {
  const params = await props.params;
  const spaceId = params.spaceId;

  try {
    const community = await communityService.getCommunity(spaceId);

    if (!community) {
      notFound();
    }

    return (
      <SpaceModalContainer>
        <SpaceDetail community={community} isModal={true} />
      </SpaceModalContainer>
    );
  } catch (error) {
    console.error(`Error loading space ${spaceId} in modal:`, error);
    return (
      <SpaceModalContainer>
        <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
          </div>
          <h2 className="text-xl font-black text-on-surface mb-2">정보를 불러올 수 없습니다</h2>
          <p className="text-sm text-on-surface-variant max-w-xs mb-6">
            데이터 접근 중 문제가 발생했습니다. 브라우저를 새로고침하거나 잠시 후 다시 시도해 주세요.
          </p>
          <a 
            href={`/space/${spaceId}`}
            className="px-6 py-2 bg-primary text-on-primary rounded-full text-sm font-bold shadow-lg"
          >
            직접 페이지 열기
          </a>
        </div>
      </SpaceModalContainer>
    );
  }
}
