import { Link } from 'react-router-dom';
import { MessageSquare, ThumbsUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DateText } from '@/components/common/DateText';
import type { IdeaListItemResponse } from '@/types/api';

export function IdeaCard({ idea }: { idea: IdeaListItemResponse }) {
  return (
    <Link to={`/ideas/${idea.id}`} className="block">
      <Card className="p-4 transition-shadow hover:shadow-md">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold">{idea.title}</h3>
          <StatusBadge status={idea.status} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{idea.authorName}</span>
          <span>·</span>
          <span>{idea.categoryName}</span>
          <span>·</span>
          <DateText value={idea.createdAt} />
        </div>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" /> {idea.voteScore}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" /> {idea.commentCount}
          </span>
        </div>
      </Card>
    </Link>
  );
}

