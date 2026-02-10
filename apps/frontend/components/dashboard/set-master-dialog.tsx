'use client';

import { useState } from 'react';
import { setMasterResume } from '@/lib/api/resume';
import { Button } from '@/components/ui/button';
import X from 'lucide-react/dist/esm/icons/x';

interface SetMasterDialogProps {
  resumeId: string;
  resumeName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SetMasterDialog({
  resumeId,
  resumeName,
  onClose,
  onSuccess,
}: SetMasterDialogProps) {
  const [category, setCategory] = useState('');
  const [useDefault, setUseDefault] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const categoryValue = useDefault ? undefined : category.trim();
      await setMasterResume(resumeId, categoryValue);
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set master resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md border-2 border-black bg-[#F0F0E8] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <h3 className="font-serif text-2xl font-bold uppercase text-black">
            Set as Master Resume
          </h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-black hover:bg-gray-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <p className="mb-6 font-mono text-sm text-gray-700">
          Setting <span className="font-bold">{resumeName}</span> as master resume.
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 border-2 border-red-600 bg-red-50 p-3 shadow-[2px_2px_0px_0px_#000000]">
            <p className="font-mono text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Default Master Option */}
          <label className="flex cursor-pointer items-start gap-3 border-2 border-black bg-white p-4 transition-colors hover:bg-gray-50">
            <input
              type="radio"
              checked={useDefault}
              onChange={() => setUseDefault(true)}
              className="mt-1 h-4 w-4 border-2 border-black text-blue-700 focus:ring-2 focus:ring-blue-700"
            />
            <div className="flex-1">
              <span className="font-mono text-sm font-bold uppercase text-black">
                Default Master
              </span>
              <p className="mt-1 font-mono text-xs text-gray-600">
                Use as the primary master resume
              </p>
            </div>
          </label>

          {/* Category-based Master Option */}
          <label className="flex cursor-pointer items-start gap-3 border-2 border-black bg-white p-4 transition-colors hover:bg-gray-50">
            <input
              type="radio"
              checked={!useDefault}
              onChange={() => setUseDefault(false)}
              className="mt-1 h-4 w-4 border-2 border-black text-blue-700 focus:ring-2 focus:ring-blue-700"
            />
            <div className="flex-1">
              <span className="font-mono text-sm font-bold uppercase text-black">
                Category-based Master
              </span>
              <p className="mt-1 font-mono text-xs text-gray-600">
                Create a master for a specific career path
              </p>
            </div>
          </label>

          {/* Category Input */}
          {!useDefault && (
            <div className="border-2 border-black bg-white p-4">
              <label htmlFor="category" className="block font-mono text-sm font-bold uppercase text-black">
                Category Name
              </label>
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Software Engineer, Data Scientist"
                className="mt-2 block w-full border-2 border-black bg-white px-3 py-2 font-mono text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-700"
                required={!useDefault}
                maxLength={50}
              />
              <p className="mt-2 font-mono text-xs text-gray-600">
                Examples: "Software Engineer", "Data Scientist", "Product Manager"
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="border-2 border-blue-700 bg-blue-50 p-4 shadow-[2px_2px_0px_0px_#000000]">
            <p className="font-mono text-xs text-blue-800">
              💡 <strong>Tip:</strong> You can have multiple master resumes for different career
              paths. When tailoring, you'll choose which master to use.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Setting...' : 'Set as Master'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
