
import { useEffect, useState } from 'react';
import { getUserRatings } from '@/services/ratingService';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { GlassContainer } from '@/components/ui/glass-container';

interface Rating {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  rater: {
    full_name: string | null;
  };
}

interface UserRatingsProps {
  userId: string;
}

export function UserRatings({ userId }: UserRatingsProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRatings = async () => {
      setIsLoading(true);
      const data = await getUserRatings(userId);
      setRatings(data as Rating[]);
      setIsLoading(false);
    };

    if (userId) {
      loadRatings();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-electricblue"></div>
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No ratings yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Reviews ({ratings.length})</h3>
      
      {ratings.map((rating) => (
        <GlassContainer key={rating.id} className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-medium">{rating.rater.full_name || 'Anonymous'}</div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(rating.created_at), 'PPP')}
              </div>
            </div>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < rating.rating 
                      ? 'fill-yellow-500 text-yellow-500' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {rating.comment && (
            <div className="text-sm mt-2 italic">
              "{rating.comment}"
            </div>
          )}
        </GlassContainer>
      ))}
    </div>
  );
}
