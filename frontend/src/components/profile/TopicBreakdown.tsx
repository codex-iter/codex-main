import { StaggerItem } from "../animations/ScrollReveal";
import { Label, SectionTitle } from "./SharedStyles";
import { TopicTag } from "./TopicTag";

export function TopicBreakdown({ sortedTopics }: { sortedTopics: [string, number][] }) {
  if (!sortedTopics || sortedTopics.length === 0) return null;
  return (
    <StaggerItem>
      <div className="border-4 border-slate-900 bg-white p-6 md:p-8 brutalist-shadow">
        <div className="mb-6">
          <Label>Analytics</Label>
          <SectionTitle>Topic Breakdown</SectionTitle>
        </div>
        <div className="flex flex-wrap gap-2">
          {sortedTopics.map(([topic]) => (
            <TopicTag key={topic} topic={topic} />
          ))}
        </div>
      </div>
    </StaggerItem>
  );
}
