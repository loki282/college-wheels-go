
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { rateUser } from '@/services/ratingService';
import { toast } from 'sonner';

interface RatingFormProps {
  rideId: string;
  userId: string;
  userName: string;
  onComplete: () => void;
}

export function RatingForm({ rideId, userId, userName, onComplete }: RatingFormProps) {
  const [rating, setRating] = useState(0);
  const [tempRating, setTempRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const success = await rateUser(rideId, userId, rating, comment);
      if (success) {
        toast.success('Review submitted successfully');
        onComplete();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium">Rate {userName}</h3>
      
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-8 w-8 cursor-pointer ${
              (tempRating || rating) >= i 
                ? 'fill-yellow-500 text-yellow-500' 
                : 'text-gray-300'
            }`}
            onMouseEnter={() => setTempRating(i)}
            onMouseLeave={() => setTempRating(0)}
            onClick={() => setRating(i)}
          />
        ))}
      </div>
      
      <Textarea
        placeholder="Add a comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="min-h-[100px]"
      />
      
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={rating === 0 || isSubmitting}
          className="bg-electricblue hover:bg-electricblue/90"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
}
