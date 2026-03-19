import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Language } from '../types';
import { Star, Send, X } from 'lucide-react';

interface ReviewModalProps {
  lang: Language;
  orderId: string;
  targetId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ lang, orderId, targetId, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = {
    zh: {
      title: '评价服务',
      rating: '评分',
      comment: '评论 (可选)',
      commentPlaceholder: '分享您的就医体验...',
      submit: '提交评价',
      submitting: '提交中...',
      success: '评价成功！',
      cancel: '取消',
    },
    en: {
      title: 'Rate Service',
      rating: 'Rating',
      comment: 'Comment (Optional)',
      commentPlaceholder: 'Share your experience...',
      submit: 'Submit Review',
      submitting: 'Submitting...',
      success: 'Review submitted!',
      cancel: 'Cancel',
    },
  }[lang];

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await apiService.createReview(orderId, targetId, rating, comment || undefined);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">{t.title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t.rating}
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t.comment}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.commentPlaceholder}
            className="w-full h-24 px-3 py-2 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-full text-slate-700 font-medium hover:bg-slate-50"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? t.submitting : t.submit}
            {!loading && <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ReviewListProps {
  lang: Language;
  targetId: string;
}

export const ReviewList: React.FC<ReviewListProps> = ({ lang, targetId }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  const t = {
    zh: {
      title: '用户评价',
      noReviews: '暂无评价',
      rating: '评分',
    },
    en: {
      title: 'Reviews',
      noReviews: 'No reviews yet',
      rating: 'Rating',
    },
  }[lang];

  useEffect(() => {
    loadReviews();
  }, [targetId]);

  const loadReviews = async () => {
    try {
      const data = await apiService.getReviewsByTarget(targetId);
      setReviews(data.reviews);
      setAverageRating(data.averageRating);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return <div className="p-4 text-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-bold text-slate-900">{t.title}</h3>
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
        </div>
        <span className="text-sm text-slate-500">({reviews.length})</span>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center text-slate-500 py-4">{t.noReviews}</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <img
                    src={review.author.profile?.avatarUrl || `https://picsum.photos/40/40?random=${review.authorId}`}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="font-medium text-slate-900">
                    {review.author.profile?.name || 'Anonymous'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-slate-600">{review.comment}</p>
              )}
              <p className="text-xs text-slate-400 mt-2">
                {formatDate(review.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
