"use client"; // Required for interactivity in Next.js App Router

import { useState } from 'react';

export default function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ rating, message }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) setStatus('success');
      else setStatus('error');
    } catch (error) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto p-6 bg-green-50 rounded-lg text-center border border-green-200">
        <h3 className="text-xl font-bold text-green-800">Thank you!</h3>
        <p className="text-green-700 mt-2">Your feedback helps us improve.</p>
        <button onClick={() => setStatus('idle')} className="mt-4 text-sm underline text-green-900">Send another</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8 bg-white shadow-2xl rounded-2xl border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">We value your opinion</h2>
      <p className="text-gray-500 mb-6 text-sm">How was your experience with our product?</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star Rating Row */}
        <div className="flex justify-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`text-3xl transition-colors ${
                star <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'
              }`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
            >
              ★
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Feedback</label>
          <textarea
            required
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="What can we do better?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={status === 'loading' || rating === 0}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {status === 'loading' ? 'Sending...' : 'Submit Feedback'}
        </button>
        
        {status === 'error' && <p className="text-red-500 text-xs text-center">Something went wrong. Please try again.</p>}
      </form>
    </div>
  );
}